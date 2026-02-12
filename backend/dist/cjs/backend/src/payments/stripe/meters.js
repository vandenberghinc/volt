var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  cancel_meter_usage_event: () => cancel_meter_usage_event,
  record_meter_usage: () => record_meter_usage
});
module.exports = __toCommonJS(stdin_exports);
var import_customers = require("./customers.js");
var import_error = require("./error.js");
var import_utils = require("./utils.js");
var import_products = require("./products.js");
var import_subscriptions = require("./subscriptions.js");
function money_major_to_pico_cents_units(amount, round) {
  const s = amount.trim();
  (0, import_utils.assert)(s.length > 0, "invalid_argument", "Property 'amount' must be a non-empty string.", { amount });
  (0, import_utils.assert)(/^\d+(\.\d+)?$/.test(s), "invalid_argument", "Property 'amount' must be a non-negative decimal.", { amount });
  const [whole_raw, frac_raw = ""] = s.split(".");
  const whole = whole_raw ?? "0";
  const frac = frac_raw ?? "";
  const SHIFT = import_products.MeterProduct.MONEY_METER_MAJOR_TO_PICO_CENTS_SHIFT;
  const frac_padded = frac + "0".repeat(SHIFT);
  const frac_keep = frac_padded.slice(0, SHIFT);
  const frac_rest = frac_padded.slice(SHIFT);
  const remainder_nonzero = /[1-9]/.test(frac_rest);
  let increment = false;
  if (frac.length > SHIFT || remainder_nonzero) {
    if (round === "exact") {
      (0, import_utils.assert)(!remainder_nonzero, "invalid_argument", "Property 'amount' has more precision than supported for exact conversion.", {
        amount,
        max_decimals: SHIFT
      });
    } else if (round === "floor") {
    } else if (round === "ceil") {
      increment = remainder_nonzero;
    } else if (round === "round") {
      increment = frac_rest.length > 0 && frac_rest[0] >= "5";
    } else {
      round.toString();
      throw new import_error.InternalStripeError("invalid_argument", `Invalid rounding: ${round}`, { round });
    }
  }
  const raw_int_str = (whole + frac_keep).replace(/^0+/, "") || "0";
  let units = BigInt(raw_int_str);
  if (increment) {
    units += 1n;
  }
  return units.toString();
}
function normalize_amount_to_string(amount) {
  if (typeof amount === "string") {
    return amount;
  }
  (0, import_utils.assert)(Number.isFinite(amount), "invalid_argument", "Property 'amount' must be a finite number.", { amount });
  (0, import_utils.assert)(Math.abs(amount) < 1e21, "invalid_argument", "Property 'amount' number is too large.", { amount });
  const s = amount.toFixed(20);
  return s.replace(/\.?0+$/, "");
}
function validate_meter_event_identifier(identifier) {
  (0, import_utils.assert)(identifier.length <= 100, "invalid_argument", "Meter event identifier must be <= 100 characters.", { identifier_length: identifier.length });
  (0, import_utils.assert)(identifier.trim().length > 0, "invalid_argument", "Meter event identifier must be non-empty.", {
    identifier_length: identifier.length
  });
  (0, import_utils.assert)(/^[a-zA-Z0-9._-]+$/.test(identifier), "invalid_argument", "Meter event identifier contains invalid characters.", {});
}
function validate_meter_event_timestamp(now, timestamp) {
  const now_ms = now.getTime();
  const ts_ms = timestamp.getTime();
  (0, import_utils.assert)(Number.isFinite(ts_ms), "invalid_argument", "Meter event timestamp is invalid.", {});
  const max_past_ms = 35 * 24 * 60 * 60 * 1e3;
  const max_future_ms = 5 * 60 * 1e3;
  (0, import_utils.assert)(ts_ms >= now_ms - max_past_ms, "invalid_argument", "Meter event timestamp is too far in the past.", { now_ms, ts_ms });
  (0, import_utils.assert)(ts_ms <= now_ms + max_future_ms, "invalid_argument", "Meter event timestamp is too far in the future.", { now_ms, ts_ms });
}
async function assert_customer_entitled_for_meter_price(client, opts) {
  const active_meters = await (0, import_subscriptions.list_subscribed_meters)(client, {
    uid: opts.uid,
    stripe_customer_id: opts.stripe_customer_id,
    all_products: opts.all_products
  });
  if (!active_meters.includes(opts.meter_product.id)) {
    throw new import_error.ExternalStripeError("subscription_not_active", "You must be subscribed to use this metered feature.", { uid: opts.uid, stripe_customer_id: opts.stripe_customer_id, meter_product: opts.meter_product.id });
  }
}
function resolve_meter_payload_keys(product) {
  const customer_key = product.customer_mapping_event_payload_key ?? "stripe_customer_id";
  const value_key = product.value_settings_event_payload_key ?? "value";
  (0, import_utils.assert)(customer_key.trim().length > 0, "invalid_product", "Meter customer payload key must be non-empty.", {
    product_id: product.id,
    customer_key
  });
  (0, import_utils.assert)(value_key.trim().length > 0, "invalid_product", "Meter value payload key must be non-empty.", {
    product_id: product.id,
    value_key
  });
  (0, import_utils.assert)(customer_key.length <= 100, "invalid_product", "Meter customer payload key must be <= 100 characters.", {
    product_id: product.id,
    customer_key_length: customer_key.length
  });
  (0, import_utils.assert)(value_key.length <= 100, "invalid_product", "Meter value payload key must be <= 100 characters.", {
    product_id: product.id,
    value_key_length: value_key.length
  });
  return { customer_key, value_key };
}
async function record_meter_usage(client, all_products, opts) {
  (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(opts.uid), "invalid_argument", "Property 'uid' must be a non-empty string.");
  (0, import_utils.assert)(opts.product.type === "meter", "invalid_argument", "Property 'product' must be a meter product.", {
    product_type: opts.product.type
  });
  (0, import_utils.assert)((0, import_utils.is_non_empty_string)(opts.product.meter_event_name) && opts.product.meter_event_name.length <= 100, "invalid_product", "Meter product meter_event_name is invalid.", { product_id: opts.product.id, meter_event_name: opts.product.meter_event_name });
  let value_str;
  const meter_kind = opts.product.kind ?? "units";
  if (meter_kind === "money") {
    (0, import_utils.assert)("amount" in opts, "invalid_argument", "Property 'amount' must be provided for money meters.", {
      product_id: opts.product.id
    });
    const rounding = opts.round ?? "exact";
    const amount_str = normalize_amount_to_string(opts.amount);
    value_str = money_major_to_pico_cents_units(amount_str, rounding);
    (0, import_utils.assert)(BigInt(value_str) >= 0n, "invalid_argument", "Property 'amount' must be >= 0.", {
      amount: amount_str,
      value_str
    });
  } else if (meter_kind === "units") {
    (0, import_utils.assert)("value" in opts, "invalid_argument", "Property 'value' must be provided for unit meters.", {
      product_id: opts.product.id
    });
    (0, import_utils.assert)(Number.isFinite(opts.value), "invalid_argument", "Property 'value' must be a finite number.", { value: opts.value });
    (0, import_utils.assert)(opts.value >= 0, "invalid_argument", "Property 'value' must be >= 0.", { value: opts.value });
    (0, import_utils.assert)(Number.isInteger(opts.value), "invalid_argument", "Property 'value' must be an integer.", { value: opts.value });
    value_str = `${opts.value}`;
  } else {
    meter_kind.toString();
    throw new import_error.InternalStripeError("invalid_product", `Invalid MeterProduct kind: ${meter_kind}`, {
      product_id: opts.product.id,
      meter_kind
    });
  }
  const identifier = opts.identifier;
  validate_meter_event_identifier(identifier);
  const now = /* @__PURE__ */ new Date();
  const timestamp_seconds = opts.timestamp ? (0, import_utils.to_unix_seconds)(opts.timestamp) : null;
  if (opts.timestamp) {
    validate_meter_event_timestamp(now, opts.timestamp);
  }
  const stripe_customer_id = await (0, import_customers.ensure_stripe_customer)(client, opts.uid);
  await assert_customer_entitled_for_meter_price(client, {
    uid: opts.uid,
    meter_product: opts.product,
    stripe_customer_id,
    all_products
  });
  const { customer_key, value_key } = resolve_meter_payload_keys(opts.product);
  const payload = {
    [customer_key]: stripe_customer_id,
    [value_key]: value_str
  };
  const meter_event = await (0, import_utils.stripe_api_call)(() => client.billing.meterEvents.create(
    {
      event_name: opts.product.meter_event_name,
      payload,
      identifier,
      ...timestamp_seconds !== null ? { timestamp: timestamp_seconds } : {}
    },
    // Idempotency at the HTTP layer in addition to Stripe's identifier dedupe helps during transient retries.
    { idempotencyKey: (0, import_utils.stable_idempotency_key)(`meter_event_create_${identifier}`, 255) }
  ), {
    operation: "billing.meterEvents.create",
    uid: opts.uid,
    stripe_customer_id,
    stripe_price_id: opts.product.stripe_price_id,
    meter_event_name: opts.product.meter_event_name,
    identifier,
    timestamp_seconds
  });
  return {
    meter_event_identifier: meter_event.identifier,
    event_name: meter_event.event_name,
    timestamp: meter_event.timestamp
  };
}
async function cancel_meter_usage_event(client, all_products, opts) {
  (0, import_utils.public_assert)(opts.product.type === "meter", "invalid_argument", "Property 'product' must be a meter product.", {
    product_type: opts.product.type
  });
  (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(opts.uid), "invalid_argument", "Property 'uid' must be a non-empty string.");
  (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(opts.meter_event_identifier), "invalid_argument", "Property 'identifier' must be a non-empty string.");
  validate_meter_event_identifier(opts.meter_event_identifier);
  const stripe_customer_id = await (0, import_customers.ensure_stripe_customer)(client, opts.uid);
  await assert_customer_entitled_for_meter_price(client, {
    uid: opts.uid,
    meter_product: opts.product,
    stripe_customer_id,
    all_products
  });
  const adjustment = await (0, import_utils.stripe_api_call)(() => client.billing.meterEventAdjustments.create({
    event_name: opts.product.meter_event_name,
    type: "cancel",
    cancel: { identifier: opts.meter_event_identifier }
  }, { idempotencyKey: (0, import_utils.stable_idempotency_key)(`meter_event_cancel_${opts.meter_event_identifier}`, 255) }), {
    operation: "billing.meterEventAdjustments.create",
    meter_event_name: opts.product.meter_event_name,
    identifier: opts.meter_event_identifier
  });
  return {
    meter_event_identifier: opts.meter_event_identifier,
    status: adjustment.status
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cancel_meter_usage_event,
  record_meter_usage
});
