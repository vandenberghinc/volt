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
  MeterProduct: () => MeterProduct,
  initialize_products: () => initialize_products,
  resolve_plan_to_parent_subscription: () => resolve_plan_to_parent_subscription
});
module.exports = __toCommonJS(stdin_exports);
var import_error = require("./error.js");
var import_utils = require("./utils.js");
var MeterProduct;
(function(MeterProduct2) {
  MeterProduct2.MONEY_METER_MAJOR_TO_PICO_CENTS_SHIFT = 14;
  MeterProduct2.MONEY_METER_UNIT_AMOUNT_DECIMAL_CENTS = "0.000000000001";
})(MeterProduct || (MeterProduct = {}));
const app_product_id_metadata_key = "__volt_app_product_id";
const app_price_id_metadata_key = "__volt_app_price_id";
const app_price_signature_metadata_key = "__volt_app_price_signature";
const stripe_list_page_size = 100;
function validate_unit_amount(unit_amount, field_name) {
  (0, import_utils.assert)(Number.isInteger(unit_amount), "invalid_product", `Property '${field_name}' must be an integer (smallest currency unit)`, { field_name, unit_amount });
  (0, import_utils.assert)(unit_amount > 0, "invalid_product", `Property '${field_name}' must be > 0`, { field_name, unit_amount });
}
function normalize_unit_amount_decimal(unit_amount_decimal, field_name) {
  (0, import_utils.assert)(typeof unit_amount_decimal === "string", "invalid_product", `Property '${field_name}' must be a string`, { field_name, unit_amount_decimal });
  let s = unit_amount_decimal.trim();
  (0, import_utils.assert)(s.length > 0, "invalid_product", `Property '${field_name}' must be non-empty`, { field_name });
  (0, import_utils.assert)(/^\d+(\.\d{1,12})?$/.test(s), "invalid_product", `Property '${field_name}' must be a non-negative decimal with up to 12 decimals`, { field_name, unit_amount_decimal: s });
  const dot = s.indexOf(".");
  const whole_raw = dot >= 0 ? s.slice(0, dot) : s;
  const frac_raw = dot >= 0 ? s.slice(dot + 1) : "";
  let whole = whole_raw.replace(/^0+/, "");
  if (whole === "")
    whole = "0";
  let frac = frac_raw;
  if (frac.length > 0) {
    frac = frac.replace(/0+$/, "");
  }
  s = frac.length > 0 ? `${whole}.${frac}` : whole;
  (0, import_utils.assert)(s !== "0", "invalid_product", `Property '${field_name}' must be > 0`, { field_name, unit_amount_decimal: s });
  (0, import_utils.assert)(/^\d+(\.\d{1,12})?$/.test(s), "invalid_product", "Normalization produced invalid decimal.", { s });
  return s;
}
function resolve_unit_price_fields(product) {
  if (product.kind === "money") {
    return { unit_amount_decimal: MeterProduct.MONEY_METER_UNIT_AMOUNT_DECIMAL_CENTS };
  }
  if (product.kind === "units") {
    const p = product.price;
    if (typeof p === "number") {
      (0, import_utils.assert)(Number.isInteger(p), "invalid_product", "Property 'price' must be an integer (smallest currency unit)", { field_name: "price", unit_amount: p });
      (0, import_utils.assert)(p > 0, "invalid_product", "Property 'price' must be > 0", { field_name: "price", unit_amount: p });
      return { unit_amount: p };
    }
    (0, import_utils.assert)(p !== null && typeof p === "object", "invalid_product", "Property 'price' must be a number or { decimals: string }", { price: p });
    const decimals = p.decimals;
    (0, import_utils.assert)(typeof decimals === "string", "invalid_product", "Property 'price.decimals' must be a string", { price: p });
    return { unit_amount_decimal: normalize_unit_amount_decimal(decimals, "price.decimals") };
  }
  product.kind.toString();
  throw new import_error.InternalStripeError("invalid_product", `Unsupported meter product kind: ${product.kind}`, { kind: product.kind });
}
function validate_quantity_rules(quantity_rules) {
  if (!quantity_rules) {
    return;
  }
  const { min, max } = quantity_rules;
  if (min !== void 0) {
    (0, import_utils.assert)(Number.isInteger(min) && min >= 1, "invalid_product", "Quantity_rules.min must be an integer >= 1", {
      min
    });
  }
  if (max !== void 0) {
    (0, import_utils.assert)(Number.isInteger(max) && max >= 1, "invalid_product", "Quantity_rules.max must be an integer >= 1", {
      max
    });
  }
  if (min !== void 0 && max !== void 0) {
    (0, import_utils.assert)(min <= max, "invalid_product", "Quantity_rules.min must be <= quantity_rules.max", { min, max });
  }
}
function validate_images(images) {
  if (!images) {
    return;
  }
  (0, import_utils.assert)(Array.isArray(images), "invalid_product", "Images must be an array", { images });
  (0, import_utils.assert)(images.length <= 8, "invalid_product", "Images must contain at most 8 URLs", { count: images.length });
  for (const image of images) {
    (0, import_utils.assert)(typeof image === "string" && image.trim().length > 0, "invalid_product", "Image URL must be a non-empty string", { image });
    (0, import_utils.assert)(/^https:\/\/\S+$/i.test(image.trim()), "invalid_product", "Image URL must be an https URL", { image });
  }
}
function make_one_time_price_signature(opts) {
  return `v1|one_time|${opts.currency}|${opts.unit_amount}|${opts.tax_behavior}`;
}
function make_recurring_price_signature(opts) {
  const meter_part = opts.usage_type === "metered" ? `|meter:${opts.meter_id ?? ""}` : "|meter:";
  const amount_part = opts.unit_amount_decimal !== void 0 ? opts.unit_amount_decimal : opts.unit_amount ?? 0;
  return `v1|recurring|${opts.currency}|${amount_part}|${opts.tax_behavior}|${opts.interval}|${opts.interval_count}|usage:${opts.usage_type}${meter_part}`;
}
function make_price_app_id(product_id, plan_id) {
  return plan_id ? `${product_id}__plan__${plan_id}` : `${product_id}__one_time`;
}
async function list_all_stripe_products(client) {
  const all_products = [];
  let starting_after;
  for (; ; ) {
    const page = await (0, import_utils.stripe_api_call)(() => client.products.list({
      limit: stripe_list_page_size,
      starting_after,
      expand: ["data.default_price"]
    }), { operation: "products.list_all", starting_after });
    all_products.push(...page.data);
    if (!page.has_more || page.data.length === 0) {
      break;
    }
    const last = page.data[page.data.length - 1];
    (0, import_utils.assert)(last !== void 0, "api_error", "Stripe products pagination returned an empty last item", {
      returned: page.data.length
    });
    starting_after = last.id;
  }
  return all_products;
}
async function list_all_stripe_prices(client) {
  const all_prices = [];
  let starting_after;
  for (; ; ) {
    const page = await (0, import_utils.stripe_api_call)(() => client.prices.list({
      limit: stripe_list_page_size,
      // We list only active prices because inactive ones are not usable for new purchases,
      // and we only need active ones for initialization comparisons.
      active: true,
      starting_after
    }), { operation: "prices.list_all", starting_after });
    all_prices.push(...page.data);
    if (!page.has_more || page.data.length === 0) {
      break;
    }
    const last = page.data[page.data.length - 1];
    (0, import_utils.assert)(last !== void 0, "api_error", "Stripe prices pagination returned an empty last item", {
      returned: page.data.length
    });
    starting_after = last.id;
  }
  return all_prices;
}
async function list_all_stripe_meters(client) {
  const all_meters = [];
  let starting_after;
  for (; ; ) {
    const page = await (0, import_utils.stripe_api_call)(() => client.billing.meters.list({
      limit: stripe_list_page_size,
      starting_after
    }), { operation: "billing.meters.list_all", starting_after });
    all_meters.push(...page.data);
    if (!page.has_more || page.data.length === 0) {
      break;
    }
    const last = page.data[page.data.length - 1];
    (0, import_utils.assert)(last !== void 0, "api_error", "Stripe meters pagination returned an empty last item", {
      returned: page.data.length
    });
    starting_after = last.id;
  }
  return all_meters;
}
function index_stripe_products_by_app_id(stripe_products) {
  const map = /* @__PURE__ */ new Map();
  for (const product of stripe_products) {
    const app_id = product.metadata?.[app_product_id_metadata_key];
    if (app_id) {
      (0, import_utils.assert)(!map.has(app_id), "api_error", "Duplicate Stripe product metadata app id", {
        app_id,
        existing_stripe_product_id: map.get(app_id)?.id,
        duplicate_stripe_product_id: product.id
      });
      map.set(app_id, product);
    }
  }
  return map;
}
function index_active_prices_by_stripe_product_id(stripe_prices) {
  const map = /* @__PURE__ */ new Map();
  for (const price of stripe_prices) {
    if (typeof price.product !== "string") {
      continue;
    }
    const list = map.get(price.product) ?? [];
    list.push(price);
    map.set(price.product, list);
  }
  return map;
}
function index_stripe_meters_by_event_name(stripe_meters) {
  const map = /* @__PURE__ */ new Map();
  for (const meter of stripe_meters) {
    const event_name = meter.event_name;
    if (event_name) {
      (0, import_utils.assert)(!map.has(event_name), "api_error", "Duplicate Stripe meter event_name", {
        event_name,
        existing_stripe_meter_id: map.get(event_name)?.id,
        duplicate_stripe_meter_id: meter.id
      });
      map.set(event_name, meter);
    }
  }
  return map;
}
function find_matching_active_price(active_prices, app_price_id, expected_signature) {
  const match = active_prices.find((p) => {
    const meta_price_id = p.metadata?.[app_price_id_metadata_key];
    const meta_signature = p.metadata?.[app_price_signature_metadata_key];
    return meta_price_id === app_price_id && meta_signature === expected_signature;
  });
  return match ?? null;
}
async function create_stripe_product(client, server, product) {
  server.log(1, `Creating Stripe product for product '${product.id}'`);
  return await (0, import_utils.stripe_api_call)(() => client.products.create({
    name: product.name,
    description: product.description,
    tax_code: product.tax_code,
    images: product.images,
    metadata: {
      [app_product_id_metadata_key]: product.id
    },
    expand: ["default_price"]
  }, { idempotencyKey: (0, import_utils.generate_random_idempotency_key)(`create_product_${product.id}`) }), { operation: "products.create", app_product_id: product.id });
}
async function update_stripe_product_if_needed(client, server, stripe_product, product) {
  const stripe_images = stripe_product.images ?? [];
  const app_images = product.images ?? [];
  const images_equal = stripe_images.length === app_images.length && stripe_images.every((url, index) => url === app_images[index]);
  const needs_update = stripe_product.name !== product.name || (stripe_product.description ?? "") !== (product.description ?? "") || (stripe_product.tax_code ?? "") !== (product.tax_code ?? "") || !images_equal;
  if (!needs_update) {
    return stripe_product;
  }
  server.log(1, `Updating Stripe product '${stripe_product.id}' to match app product '${product.id}'`);
  return await (0, import_utils.stripe_api_call)(() => client.products.update(stripe_product.id, {
    name: product.name,
    description: product.description,
    tax_code: product.tax_code,
    images: product.images,
    expand: ["default_price"]
  }, { idempotencyKey: (0, import_utils.generate_random_idempotency_key)(`update_product_${product.id}_${stripe_product.id}`) }), { operation: "products.update", app_product_id: product.id, stripe_product_id: stripe_product.id });
}
async function update_stripe_product_default_price_if_needed(client, server, stripe_product, default_price, other_plans_from_parent_subscription) {
  let default_price_id = null;
  if (typeof stripe_product.default_price === "string") {
    default_price_id = stripe_product.default_price;
  } else if (stripe_product.default_price && typeof stripe_product.default_price === "object") {
    default_price_id = stripe_product.default_price.id;
  }
  if (!default_price_id) {
    const fetched = await (0, import_utils.stripe_api_call)(() => client.products.retrieve(stripe_product.id, {
      expand: ["default_price"]
    }), { operation: "products.retrieve_for_default_price", stripe_product_id: stripe_product.id });
    default_price_id = typeof fetched.default_price === "string" ? fetched.default_price : fetched.default_price?.id ?? null;
  }
  if (default_price_id === default_price.id || other_plans_from_parent_subscription?.some((plan) => plan.stripe_price_id === default_price_id)) {
    return;
  }
  server.log(1, `Updating default price for Stripe product '${stripe_product.id}' to price '${default_price.id}'`);
  await (0, import_utils.stripe_api_call)(() => client.products.update(stripe_product.id, {
    default_price: default_price.id
  }, { idempotencyKey: (0, import_utils.generate_random_idempotency_key)(`update_product_default_price_${stripe_product.id}_${default_price.id}`) }), { operation: "products.update", app_product_id: stripe_product.metadata?.[app_product_id_metadata_key], stripe_product_id: stripe_product.id, action: "update_default_price" });
}
async function create_one_time_price(client, server, opts) {
  server.log(1, `Creating stripe one-time price for product: ${opts.product_id}`);
  return await (0, import_utils.stripe_api_call)(() => client.prices.create({
    product: opts.stripe_product_id,
    currency: opts.currency,
    unit_amount: opts.unit_amount,
    // Docs: https://docs.stripe.com/tax/tax-behavior
    tax_behavior: opts.tax_behavior,
    nickname: opts.nickname,
    metadata: {
      [app_price_id_metadata_key]: opts.app_price_id,
      [app_price_signature_metadata_key]: make_one_time_price_signature({
        currency: opts.currency,
        unit_amount: opts.unit_amount,
        tax_behavior: opts.tax_behavior
      })
    }
  }, { idempotencyKey: (0, import_utils.generate_random_idempotency_key)(`create_one_time_price_${opts.app_price_id}_${opts.stripe_product_id}`) }), { operation: "prices.create", app_price_id: opts.app_price_id, stripe_product_id: opts.stripe_product_id });
}
async function create_recurring_price(client, server, opts) {
  const recurring = {
    interval: opts.interval,
    interval_count: opts.interval_count,
    // "metered" links the price to a billing meter; "licensed" is standard recurring.
    // Docs: https://docs.stripe.com/api/prices/create (recurring.usage_type)
    usage_type: opts.recurring_usage.usage_type,
    // For metered prices, connect the Stripe price to a meter id.
    // Docs: https://docs.stripe.com/api/prices/create (recurring.meter)
    ...opts.recurring_usage.usage_type === "metered" ? { meter: opts.recurring_usage.meter_id } : {}
  };
  const signature = make_recurring_price_signature({
    currency: opts.currency,
    ..."unit_amount_decimal" in opts ? { unit_amount_decimal: opts.unit_amount_decimal } : { unit_amount: opts.unit_amount },
    tax_behavior: opts.tax_behavior,
    interval: opts.interval,
    interval_count: opts.interval_count,
    usage_type: opts.recurring_usage.usage_type,
    meter_id: opts.recurring_usage.usage_type === "metered" ? opts.recurring_usage.meter_id : void 0
  });
  server.log(1, `Creating stripe recurring price for product: ${opts.product_id}`);
  return await (0, import_utils.stripe_api_call)(() => client.prices.create({
    product: opts.stripe_product_id,
    currency: opts.currency,
    ..."unit_amount_decimal" in opts ? { unit_amount_decimal: opts.unit_amount_decimal } : { unit_amount: opts.unit_amount },
    tax_behavior: opts.tax_behavior,
    nickname: opts.nickname,
    // Docs: https://docs.stripe.com/billing/prices-guide#create-prices
    recurring,
    metadata: {
      [app_price_id_metadata_key]: opts.app_price_id,
      [app_price_signature_metadata_key]: signature
    }
  }, { idempotencyKey: (0, import_utils.generate_random_idempotency_key)(`create_recurring_price_${opts.app_price_id}_${opts.stripe_product_id}`) }), { operation: "prices.create", app_price_id: opts.app_price_id, stripe_product_id: opts.stripe_product_id });
}
async function create_stripe_meter(client, server, product) {
  const aggregation_formula = product.aggregation_formula ?? "sum";
  const customer_mapping_event_payload_key = product.customer_mapping_event_payload_key ?? "stripe_customer_id";
  const value_settings_event_payload_key = product.value_settings_event_payload_key ?? "value";
  server.log(1, `Creating stripe billing meter for product: ${product.id}`);
  return await (0, import_utils.stripe_api_call)(() => client.billing.meters.create({
    display_name: product.name,
    event_name: product.meter_event_name,
    default_aggregation: {
      formula: aggregation_formula
    },
    // Stripe currently requires by_id mapping and a payload key that contains the customer id.
    // Docs: https://docs.stripe.com/api/billing/meter/create#billing_meter_create-customer_mapping
    customer_mapping: {
      type: "by_id",
      event_payload_key: customer_mapping_event_payload_key
    },
    // Value key used as the numeric value for "sum"/"last" aggregation.
    // Docs: https://docs.stripe.com/api/billing/meter/create#billing_meter_create-value_settings
    value_settings: {
      event_payload_key: value_settings_event_payload_key
    },
    ...product.event_time_window ? { event_time_window: product.event_time_window } : {}
  }, { idempotencyKey: (0, import_utils.generate_random_idempotency_key)(`create_billing_meter_${product.id}_${product.meter_event_name}`) }), {
    operation: "billing.meters.create",
    app_meter_product_id: product.id,
    event_name: product.meter_event_name,
    aggregation_formula,
    customer_mapping_event_payload_key,
    value_settings_event_payload_key,
    event_time_window: product.event_time_window ?? null
  });
}
async function map_with_concurrency(items, concurrency, mapper) {
  (0, import_utils.assert)(Number.isInteger(concurrency) && concurrency >= 1, "invalid_argument", "Concurrency must be an integer >= 1", { concurrency });
  const results = new Array(items.length);
  let next_index = 0;
  let first_error = null;
  const worker = async () => {
    for (; ; ) {
      if (first_error)
        return;
      const current_index = next_index;
      next_index += 1;
      if (current_index >= items.length) {
        return;
      }
      const current_item = items[current_index];
      (0, import_utils.assert)(current_item !== void 0, "invalid_argument", "Missing item for concurrency worker index", { current_index, items_length: items.length });
      try {
        results[current_index] = await mapper(current_item, current_index);
      } catch (e) {
        if (!first_error)
          first_error = e;
        return;
      }
    }
  };
  const worker_count = Math.min(concurrency, items.length);
  await Promise.allSettled(Array.from({ length: worker_count }, () => worker()));
  if (first_error)
    throw first_error;
  return results;
}
async function initialize_product(client, server, product, stripe_products_by_app_id, active_prices_by_stripe_product_id, stripe_meters_by_event_name) {
  (0, import_utils.assert)(product.id.trim().length > 0, "invalid_product", "Product.id must be non-empty", { product_id: product.id });
  (0, import_utils.assert)(product.name.trim().length > 0, "invalid_product", "Product.name must be non-empty", { product_id: product.id });
  (0, import_utils.assert)(product.currency.trim().length > 0, "invalid_product", "Product.currency must be non-empty", { product_id: product.id });
  (0, import_utils.assert)(product.tax_code.trim().length > 0, "invalid_product", "Product.tax_code must be non-empty", { product_id: product.id });
  (0, import_utils.assert)(product.tax_behavior === "inclusive" || product.tax_behavior === "exclusive" || product.tax_behavior === "unspecified", "invalid_product", "Product.tax_behavior is invalid", { product_id: product.id, tax_behavior: product.tax_behavior });
  validate_images(product.images);
  product.currency = product.currency.trim().toLowerCase();
  (0, import_utils.assert)(/^[a-z]{3}$/.test(product.currency), "invalid_product", `Invalid currency code: "${product.currency}"`, { currency: product.currency });
  if (product.type === "one_time") {
    validate_unit_amount(product.price, "Product.price");
    validate_quantity_rules(product.quantity_rules);
  } else if (product.type === "subscription") {
    (0, import_utils.assert)(Array.isArray(product.plans) && product.plans.length > 0, "invalid_product", "Subscription product must have plans", { product_id: product.id });
    if (product.trial_days !== void 0) {
      (0, import_utils.assert)(Number.isInteger(product.trial_days) && product.trial_days >= 1, "invalid_product", "Subscription.trial_days must be an integer >= 1", { product_id: product.id, trial_days: product.trial_days });
    }
    if (product.billing_anchor !== void 0) {
      const anchor = product.billing_anchor;
      (0, import_utils.assert)(anchor === "immediately" || anchor === "first_of_month", "invalid_product", "Subscription.billing_anchor is invalid", { product_id: product.id, billing_anchor: anchor });
    } else {
      product.billing_anchor = "immediately";
    }
    for (const plan of product.plans) {
      (0, import_utils.assert)(plan.id.trim().length > 0, "invalid_product", "Plan.id must be non-empty", { product_id: product.id });
      (0, import_utils.assert)(plan.name.trim().length > 0, "invalid_product", "Plan.name must be non-empty", { product_id: product.id, plan_id: plan.id });
      validate_unit_amount(plan.price, "Plan.price");
      (0, import_utils.assert)(Number.isInteger(plan.interval_count) && plan.interval_count >= 1, "invalid_product", "Plan.interval_count must be >= 1", { product_id: product.id, plan_id: plan.id, interval_count: plan.interval_count });
      (0, import_utils.assert)(plan.interval === "day" || plan.interval === "week" || plan.interval === "month" || plan.interval === "year", "invalid_product", "Plan.interval is invalid", { product_id: product.id, plan_id: plan.id, interval: plan.interval });
    }
  } else if (product.type === "meter") {
    (0, import_utils.assert)(product.interval === "day" || product.interval === "week" || product.interval === "month" || product.interval === "year", "invalid_product", "Property 'interval' is invalid", { product_id: product.id, interval: product.interval });
    if (product.kind === "units") {
      (0, import_utils.assert)(product.price !== void 0, "invalid_product", "MeterProduct with kind='units' must define 'price'.", { product_id: product.id });
      resolve_unit_price_fields(product);
    } else if (product.kind === "money") {
      (0, import_utils.assert)(product.price === void 0, "invalid_product", "MeterProduct with kind='money' must not define 'price'.", { product_id: product.id });
    } else {
      product.kind.toString();
      throw new import_error.InternalStripeError("invalid_product", `Invalid 'kind': ${product.kind}`, { product_id: product.id, kind: product.kind });
    }
    (0, import_utils.assert)(Number.isInteger(product.interval_count) && product.interval_count >= 1, "invalid_product", "Property 'interval_count' must be >= 1", { product_id: product.id, interval_count: product.interval_count });
    (0, import_utils.assert)(product.meter_event_name.trim().length > 0, "invalid_product", "Property 'meter_event_name' must be non-empty", {
      product_id: product.id,
      meter_event_name: product.meter_event_name
    });
    (0, import_utils.assert)(product.meter_event_name.length <= 100, "invalid_product", "Property 'meter_event_name' must be <= 100 characters", { product_id: product.id, meter_event_name_length: product.meter_event_name.length });
    if (product.aggregation_formula !== void 0) {
      const formula = product.aggregation_formula;
      (0, import_utils.assert)(formula === "count" || formula === "sum" || formula === "last", "invalid_product", "Property 'aggregation_formula' is invalid", { product_id: product.id, aggregation_formula: formula });
    }
    if (product.customer_mapping_event_payload_key !== void 0) {
      (0, import_utils.assert)(product.customer_mapping_event_payload_key.trim().length > 0, "invalid_product", "Property 'customer_mapping_event_payload_key' must be non-empty", { product_id: product.id, customer_mapping_event_payload_key: product.customer_mapping_event_payload_key });
    }
    if (product.value_settings_event_payload_key !== void 0) {
      (0, import_utils.assert)(product.value_settings_event_payload_key.trim().length > 0, "invalid_product", "Property 'value_settings_event_payload_key' must be non-empty", { product_id: product.id, value_settings_event_payload_key: product.value_settings_event_payload_key });
    }
    if (product.event_time_window !== void 0) {
      const window = product.event_time_window;
      (0, import_utils.assert)(window === "hour" || window === "day", "invalid_product", "Property 'event_time_window' is invalid", { product_id: product.id, event_time_window: window });
    }
  } else {
    product.type.toString();
    throw new import_error.InternalStripeError("invalid_product", `Invalid product type: ${product.type}`, {
      product_id: product.id,
      product_type: product.type
    });
  }
  let stripe_meter = null;
  if (product.type === "meter") {
    stripe_meter = stripe_meters_by_event_name.get(product.meter_event_name) ?? null;
    if (!stripe_meter) {
      stripe_meter = await create_stripe_meter(client, server, product);
      stripe_meters_by_event_name.set(product.meter_event_name, stripe_meter);
    }
  }
  let stripe_product = stripe_products_by_app_id.get(product.id) ?? null;
  if (!stripe_product) {
    stripe_product = await create_stripe_product(client, server, product);
    stripe_products_by_app_id.set(product.id, stripe_product);
  } else {
    stripe_product = await update_stripe_product_if_needed(client, server, stripe_product, product);
    stripe_products_by_app_id.set(product.id, stripe_product);
  }
  const active_prices = active_prices_by_stripe_product_id.get(stripe_product.id) ?? [];
  if (product.type === "one_time") {
    const app_price_id = make_price_app_id(product.id, void 0);
    const signature = make_one_time_price_signature({
      currency: product.currency,
      unit_amount: product.price,
      tax_behavior: product.tax_behavior
    });
    let stripe_price = find_matching_active_price(active_prices, app_price_id, signature);
    if (!stripe_price) {
      stripe_price = await create_one_time_price(client, server, {
        product_id: product.id,
        stripe_product_id: stripe_product.id,
        app_price_id,
        currency: product.currency,
        unit_amount: product.price,
        tax_behavior: product.tax_behavior,
        nickname: product.name
      });
      const updated_prices = [...active_prices, stripe_price];
      active_prices_by_stripe_product_id.set(stripe_product.id, updated_prices);
    }
    await update_stripe_product_default_price_if_needed(client, server, stripe_product, stripe_price);
    return {
      ...product,
      stripe_product_id: stripe_product.id,
      stripe_price_id: stripe_price.id
    };
  } else if (product.type === "subscription") {
    const initialized_plans = [];
    for (const plan of product.plans) {
      const app_price_id = make_price_app_id(product.id, plan.id);
      const signature = make_recurring_price_signature({
        currency: product.currency,
        unit_amount: plan.price,
        tax_behavior: product.tax_behavior,
        interval: plan.interval,
        interval_count: plan.interval_count,
        usage_type: "licensed"
      });
      let stripe_price = find_matching_active_price(active_prices, app_price_id, signature);
      if (!stripe_price) {
        stripe_price = await create_recurring_price(client, server, {
          product_id: product.id,
          stripe_product_id: stripe_product.id,
          app_price_id,
          currency: product.currency,
          unit_amount: plan.price,
          tax_behavior: product.tax_behavior,
          nickname: `${product.name} - ${plan.name}`,
          interval: plan.interval,
          interval_count: plan.interval_count,
          recurring_usage: { usage_type: "licensed" }
        });
        const updated_prices = [...active_prices, stripe_price];
        active_prices_by_stripe_product_id.set(stripe_product.id, updated_prices);
      }
      await update_stripe_product_default_price_if_needed(client, server, stripe_product, stripe_price, initialized_plans);
      initialized_plans.push({
        ...plan,
        type: "subscription_plan",
        subscription_id: product.id,
        stripe_price_id: stripe_price.id
      });
    }
    return {
      ...product,
      stripe_product_id: stripe_product.id,
      plans: initialized_plans
    };
  } else if (product.type === "meter") {
    (0, import_utils.assert)(stripe_meter !== null, "api_error", "Stripe meter must be resolved for meter product initialization", {
      product_id: product.id,
      meter_event_name: product.meter_event_name
    });
    const app_price_id = `${product.id}__meter`;
    const unit_price_fields = resolve_unit_price_fields(product);
    const signature = make_recurring_price_signature({
      currency: product.currency,
      ...unit_price_fields,
      tax_behavior: product.tax_behavior,
      interval: product.interval,
      interval_count: product.interval_count,
      usage_type: "metered",
      meter_id: stripe_meter.id
    });
    let stripe_price = find_matching_active_price(active_prices, app_price_id, signature);
    if (!stripe_price) {
      const new_price = await create_recurring_price(client, server, {
        product_id: product.id,
        stripe_product_id: stripe_product.id,
        app_price_id,
        currency: product.currency,
        ...unit_price_fields,
        tax_behavior: product.tax_behavior,
        nickname: product.name,
        interval: product.interval,
        interval_count: product.interval_count,
        recurring_usage: { usage_type: "metered", meter_id: stripe_meter.id }
      });
      stripe_price = new_price;
      active_prices_by_stripe_product_id.set(stripe_product.id, [...active_prices, new_price]);
    }
    await update_stripe_product_default_price_if_needed(client, server, stripe_product, stripe_price);
    return {
      ...product,
      stripe_meter_id: stripe_meter.id,
      stripe_product_id: stripe_product.id,
      stripe_price_id: stripe_price.id
    };
  } else {
    product.type.toString();
    throw new import_error.InternalStripeError("invalid_product", `Invalid product type: ${product.type}`, {
      product_id: product.id,
      product_type: product.type
    });
  }
}
function resolve_plan_to_parent_subscription(opts) {
  for (const product of opts.all_products) {
    if (product.type === "subscription" && product.id === opts.plan.subscription_id) {
      return product;
    }
  }
  throw new import_error.InternalStripeError("invalid_product", "Subscription plan refers to a missing parent subscription product.", { plan_id: opts.plan.id, subscription_id: opts.plan.subscription_id });
}
async function initialize_products(client, server, products) {
  (0, import_utils.assert)(Array.isArray(products), "invalid_argument", "Products must be an array");
  const seen_ids = /* @__PURE__ */ new Set();
  const seen_meter_event_names = /* @__PURE__ */ new Set();
  for (const product of products) {
    (0, import_utils.assert)(!seen_ids.has(product.id), "invalid_product", `Duplicate product id: ${product.id}`, { product_id: product.id });
    seen_ids.add(product.id);
    if (product.type === "subscription") {
      for (const plan of product.plans) {
        (0, import_utils.assert)(!seen_ids.has(plan.id), "invalid_product", `Duplicate plan id: ${plan.id} in product ${product.id}`, { product_id: product.id, plan_id: plan.id });
        seen_ids.add(plan.id);
      }
    }
    if (product.type === "meter") {
      (0, import_utils.assert)(!seen_meter_event_names.has(product.meter_event_name), "invalid_product", `Duplicate meter_event_name: ${product.meter_event_name}`, { product_id: product.id, meter_event_name: product.meter_event_name });
      seen_meter_event_names.add(product.meter_event_name);
    }
  }
  const [all_stripe_products, all_active_stripe_prices, all_stripe_meters] = await Promise.all([
    list_all_stripe_products(client),
    list_all_stripe_prices(client),
    list_all_stripe_meters(client)
  ]);
  const stripe_products_by_app_id = index_stripe_products_by_app_id(all_stripe_products);
  const active_prices_by_stripe_product_id = index_active_prices_by_stripe_product_id(all_active_stripe_prices);
  const stripe_meters_by_event_name = index_stripe_meters_by_event_name(all_stripe_meters);
  const concurrency = 5;
  const initialized_products = await map_with_concurrency(products, concurrency, async (product) => {
    return await initialize_product(client, server, product, stripe_products_by_app_id, active_prices_by_stripe_product_id, stripe_meters_by_event_name);
  });
  return initialized_products;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MeterProduct,
  initialize_products,
  resolve_plan_to_parent_subscription
});
