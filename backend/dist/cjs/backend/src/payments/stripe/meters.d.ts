/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */
import Stripe from "stripe";
import { InitializedMeterProduct, InitializedProduct, MeterProduct } from "./products.js";
import { Server } from "../../server.js";
type AmountRounding = "exact" | "floor" | "ceil" | "round";
/**
 * The options for recording meter usage.
 */
export type RecordMeterUsageOpts<Kind extends MeterProduct.Kind> = {
    /** The internal user id (uid) whose usage should be recorded. */
    uid: string;
    /** The initialized meter product to record usage for. */
    product: InitializedMeterProduct<Kind extends "units" ? MeterProduct.UnitsMeter : Kind extends "money" ? MeterProduct.MoneyMeter : never>;
    /**
     * Optional event timestamp.
     * Must be within the past 35 calendar days or up to 5 minutes in the future.
     * @see https://docs.stripe.com/api/billing/meter-event/create
     */
    timestamp?: Date;
    /**
     * Event identifier to deduplicate accidental retries.
     * Stripe enforces uniqueness within a rolling >=24h window.
     * Must be non-empty, max 100 chars, and contain only letters, numbers, dots, underscores or hyphens.
     * @see https://docs.stripe.com/api/billing/meter-event/create
     */
    identifier: string;
} & (Kind extends "units" ? {
    /**
     * The numeric usage value to record (integer).
     * For "sum"/"last" meters this is the numeric value.
     * For "count" meters this can be 1 per event (but we still send a value).
     */
    value: number;
} : Kind extends "money" ? {
    /**
     * Money amount in major units (e.g., "0.007463" USD), used only when product.kind === "money".
     * Can be string or number (number is normalized to string).
     */
    amount: string | number;
    /**
     * Rounding mode used when converting amount to internal integer units.
     * @default "exact"
     * @warning When round is `exact`, amounts with more precision than supported will be rejected by a thrown error, to prevent silent rounding bugs. Use an explicit rounding mode to allow lossy conversions.
     */
    round?: AmountRounding;
} : never);
/**
 * The result of recording meter usage.
 */
export interface RecordMeterUsageResult {
    /** The Stripe billing meter event id. */
    meter_event_identifier: string;
    /** The meter event name used. */
    event_name: string;
    /** The unix timestamp (seconds) used for the event, if provided. */
    timestamp: number;
}
/**
 * Record usage for a metered subscription by creating a Stripe Billing Meter Event.
 *
 * Security & correctness guarantees:
 * - Requires that the user has an active-ish subscription containing the meter product's price id.
 * - Uses the meter's configured payload keys for customer/value mapping.
 * - Allows caller-provided `identifier` to dedupe retries.
 *
 * Stripe docs:
 * - Create meter event: https://docs.stripe.com/api/billing/meter-event/create
 * - Record usage guide: https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api
 *
 * @throws {InternalStripeError} When round mode is `exact` and the amount has more precision than supported.
 * @throws {InternalStripeError} On internal errors.
 * @throws {ExternalStripeError} On external errors such as the customer not being entitled to record usage for the meter product.
 */
export declare function record_meter_usage<Kind extends MeterProduct.Kind>(client: Stripe, server: Server, all_products: InitializedProduct[], opts: RecordMeterUsageOpts<Kind>): Promise<RecordMeterUsageResult>;
/** The options for {@link cancel_meter_usage_event} */
export interface CancelMeterUsageEventOpts {
    /** The user id. */
    uid: string;
    /** The meter product whose event stream the event belongs to. */
    product: InitializedMeterProduct;
    /** The identifier of the meter event to cancel. */
    meter_event_identifier: string;
}
/** The result type of {@link cancel_meter_usage_event} */
export interface CancelMeterUsageEventResult {
    /** The identifier of the canceled meter event. */
    meter_event_identifier: string;
    /** The status of the adjustment created to cancel the event. Typically "pending". */
    status: string;
}
/**
 * Cancel a previously recorded meter event by identifier (best-effort within 24 hours).
 *
 * This is useful for:
 * - reverting accidental double-reporting
 * - compensating failed internal workflows
 *
 * Stripe docs:
 * - Create meter event adjustment: https://docs.stripe.com/api/billing/meter-event-adjustment/create
 */
export declare function cancel_meter_usage_event(client: Stripe, server: Server, all_products: InitializedProduct[], opts: CancelMeterUsageEventOpts): Promise<CancelMeterUsageEventResult>;
export {};
