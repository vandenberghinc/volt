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
  SafeInt: () => SafeInt
});
module.exports = __toCommonJS(stdin_exports);
class SafeInt {
  // ----------------------------------------------------------------
  // Fields
  // ----------------------------------------------------------------
  /**
   * The stored integer (may be negative) measured at {@link int_scale}.
   */
  int_value;
  /**
   * The canonical integer scale for {@link int_value}.
   */
  int_scale;
  // ----------------------------------------------------------------
  // Constructors
  // ----------------------------------------------------------------
  /**
   * Construct by converting from `opts.from_scale` to `opts.to_scale`. **Exact by default**.
   *
   * @param value The numeric input at `opts.from_scale`.
   *              - If `from_scale === Base`, `value` may be a float. When `round` is omitted,
   *                `value * to_scale` must be an integer. If `round` is provided, that rounding is applied.
   *              - If `from_scale !== Base`, `value` must be a safe integer.
   *              - If `value` is a string:
   *                - If `from_scale === Base`, it may be a decimal string (exact parsing).
   *                - Otherwise it must be an integer string.
   * @param opts  The canonical scale or scale options.
   * @param opts.to_scale   The target scale for storage (the resulting instance type is `SafeInt<opts.to_scale>`).
   * @param opts.from_scale The source scale of {@link value}, defaults to {@link SafeInt.Scale.Base}.
   * @param opts.round       Optional rounding mode for non-exact conversions (default: `"exact"`).
   *
   * @example
   * new SafeInt(123_000, SafeInt.Scale.Nano)
   * @example
   * new SafeInt(123_000, "nano")
   * @example
   * new SafeInt(1.5, { from_scale: SafeInt.Scale.Base, to_scale: SafeInt.Scale.Milli, round: "round" }) // 1500
   * @example
   * new SafeInt(2n, { from_scale: SafeInt.Scale.Base, to_scale: SafeInt.Scale.Nano }) // 2_000_000_000n
   * @example
   * // Exact, decimal-safe parsing (no float surprises)
   * new SafeInt("1.005", { from_scale: "base", to_scale: "milli", round: "round" }) // 1005
   * @example
   * // Integer string at already-at-scale (underscores allowed)
   * new SafeInt("123_000", "nano")
   *
   * @throws
   * Error If inputs are invalid, conversion overflows, or exactness is required but not met.
   *
   * @docs
   */
  constructor(value, opts) {
    if (typeof opts === "number" || typeof opts === "string") {
      const scale = typeof opts === "string" ? SafeInt.str_to_scale(opts) : opts;
      if (!Number.isSafeInteger(scale) || scale <= 0) {
        throw new Error(`Invalid scale: expected positive safe integer, got ${scale}`);
      }
      if (typeof value === "string") {
        this.int_value = SafeInt.parse_int_str(value, "value");
      } else if (typeof value === "number") {
        if (!Number.isSafeInteger(value)) {
          throw new Error(`Invalid value: expected safe integer, got ${value}`);
        }
        this.int_value = BigInt(value);
      } else {
        this.int_value = value;
      }
      this.int_scale = scale;
      return;
    }
    let { to_scale, from_scale = SafeInt.Scale.Base, round = "exact" } = opts;
    if (typeof to_scale === "string") {
      to_scale = SafeInt.str_to_scale(to_scale);
    }
    if (typeof from_scale === "string") {
      from_scale = SafeInt.str_to_scale(from_scale);
    }
    if (!Number.isSafeInteger(from_scale) || from_scale <= 0) {
      throw new Error(`Invalid from_scale: expected positive safe integer, got ${from_scale}`);
    }
    if (!Number.isSafeInteger(to_scale) || to_scale <= 0) {
      throw new Error(`Invalid to_scale: expected positive safe integer, got ${to_scale}`);
    }
    let converted;
    if (from_scale === to_scale) {
      if (to_scale === SafeInt.Scale.Base) {
        if (typeof value === "string") {
          converted = SafeInt.parse_int_str(value, "value");
        } else if (typeof value === "bigint") {
          converted = value;
        } else {
          const n = value;
          if (round === "exact") {
            if (!Number.isSafeInteger(n)) {
              throw new Error(`Exact constructor requires integer at base scale, got ${n}`);
            }
            converted = BigInt(n);
          } else {
            const rounded = SafeInt.apply_round(n, round);
            if (!Number.isSafeInteger(rounded)) {
              throw new Error(`Rounding produced non-integer at base scale: ${rounded}`);
            }
            converted = BigInt(rounded);
          }
        }
      } else {
        if (typeof value === "string") {
          converted = SafeInt.parse_int_str(value, "value");
        } else if (typeof value === "number") {
          if (!Number.isSafeInteger(value)) {
            throw new Error(`Invalid value: expected safe integer at scale=${to_scale}, got ${value}`);
          }
          converted = BigInt(value);
        } else {
          converted = value;
        }
      }
    } else if (from_scale === SafeInt.Scale.Base) {
      if (typeof value === "string") {
        converted = SafeInt.parse_base_decimal_to_scaled(value, to_scale, round);
      } else if (typeof value === "bigint") {
        converted = value * BigInt(to_scale);
      } else {
        const n = value;
        const product = n * to_scale;
        if (round === "exact") {
          if (!Number.isFinite(product) || !Number.isInteger(product)) {
            throw new Error(`Exact conversion failed: ${n} * ${to_scale} is not an integer`);
          }
          if (!Number.isSafeInteger(product)) {
            throw new Error(`Overflow converting base->${to_scale}: ${product}`);
          }
          converted = BigInt(product);
        } else {
          const rounded = SafeInt.apply_round(product, round);
          if (!Number.isSafeInteger(rounded)) {
            throw new Error(`Overflow/invalid rounding converting base->${to_scale}: ${product} -> ${rounded}`);
          }
          converted = BigInt(rounded);
        }
      }
    } else if (to_scale === SafeInt.Scale.Base) {
      if (typeof value === "string") {
        const v = SafeInt.parse_int_str(value, "value");
        converted = SafeInt.div_to_base(v, from_scale, round);
      } else if (typeof value === "number") {
        if (!Number.isSafeInteger(value)) {
          throw new Error(`Invalid value: expected safe integer at scale=${from_scale}, got ${value}`);
        }
        converted = SafeInt.div_to_base(BigInt(value), from_scale, round);
      } else {
        converted = SafeInt.div_to_base(value, from_scale, round);
      }
    } else {
      if (typeof value === "number") {
        if (!Number.isSafeInteger(value)) {
          throw new Error(`Invalid value: expected safe integer at scale=${from_scale}, got ${value}`);
        }
      }
      const v = typeof value === "string" ? SafeInt.parse_int_str(value, "value") : typeof value === "number" ? BigInt(value) : value;
      converted = SafeInt.convert_int_scale(v, from_scale, to_scale, round);
    }
    this.int_value = converted;
    this.int_scale = to_scale;
  }
  // ----------------------------------------------------------------
  // value & scale accessors
  // ----------------------------------------------------------------
  /**
   * Retrieve the underlying integer (measured in {@link scale} units).
   *
   * @returns The stored integer.
   *
   * @docs
   */
  value() {
    return this.int_value;
  }
  /**
   * Conver the stored integer to a `number`.
   *
   * @returns The amount in stored integer units as `number` instead of `bigint`.
   * @throws Error if the stored integer cannot be represented safely as a `number`.
   *
   * @docs
   */
  to_number() {
    const max_safe = BigInt(Number.MAX_SAFE_INTEGER);
    if (this.int_value > max_safe || this.int_value < -max_safe) {
      throw new Error(`Cannot represent value as number safely for to_number(): ${this.int_value.toString()}`);
    }
    return Number(this.int_value);
  }
  /**
   * Alias of {@link value}. Provided for JavaScript numeric coercion.
   *
   * @returns The stored integer.
   *
   * @docs
   */
  valueOf() {
    return this.int_value;
  }
  /**
   * Retrieve this instance's canonical scale.
   *
   * @returns The positive integer scale for this value.
   *
   * @docs
   */
  scale() {
    return this.int_scale;
  }
  // ----------------------------------------------------------------
  // presentation conversion
  // ----------------------------------------------------------------
  /**
   * Convert to base scale (1) as a floating-point number (presentation).
   *
   * @returns The amount in base units as a float.
   *
   * @docs
   */
  to_base_float() {
    if (this.int_scale === SafeInt.Scale.Base)
      return this.to_number();
    const denom = BigInt(this.int_scale);
    const q = this.int_value / denom;
    const r = this.int_value % denom;
    const max_safe = BigInt(Number.MAX_SAFE_INTEGER);
    if (q > max_safe || q < -max_safe) {
      throw new Error(`Cannot represent base float safely: quotient ${q.toString()} out of range`);
    }
    return Number(q) + Number(r) / Number(denom);
  }
  // ----------------------------------------------------------------
  // scale conversion — strongly typed
  // ----------------------------------------------------------------
  /**
   * Convert this instance to another integer scale.
   * **Exact by default** — provide a {@link SafeInt.Rounding} to allow rounding.
   *
   * @typeParam T - Target scale (see {@link SafeInt.Scale}).
   * @param to_scale The target canonical scale.
   * @param round     Rounding mode for non-exact ratios (default `"exact"`).
   *
   * @returns A new {@link SafeInt} typed as `SafeInt<T>`, storing an integer at `to_scale`.
   *
   * @docs
   */
  to_scale(to_scale, round = "exact") {
    if (!Number.isSafeInteger(to_scale) || to_scale <= 0) {
      throw new Error(`Invalid to_scale: expected positive safe integer, got ${to_scale}`);
    }
    if (this.int_scale === to_scale) {
      return new SafeInt(this.int_value, to_scale);
    }
    if (to_scale === SafeInt.Scale.Base) {
      const base_int = SafeInt.div_to_base(this.int_value, this.int_scale, round);
      return new SafeInt(base_int, SafeInt.Scale.Base);
    }
    if (this.int_scale === SafeInt.Scale.Base) {
      const product = this.int_value * BigInt(to_scale);
      return new SafeInt(product, to_scale);
    }
    const n = SafeInt.convert_int_scale(this.int_value, this.int_scale, to_scale, round);
    return new SafeInt(n, to_scale);
  }
  /**
   * Rescale to base (1).
   *
   * @returns A new `SafeInt<SafeInt.Scale.Base>`.
   *
   * @docs
   */
  base() {
    return this.to_scale(SafeInt.Scale.Base);
  }
  /**
   * Rescale to milli (1e3).
   *
   * @returns A new `SafeInt<SafeInt.Scale.Milli>`.
   *
   * @docs
   */
  milli() {
    return this.to_scale(SafeInt.Scale.Milli);
  }
  /**
   * Rescale to micro (1e6).
   *
   * @returns A new `SafeInt<SafeInt.Scale.Micro>`.
   *
   * @docs
   */
  micro() {
    return this.to_scale(SafeInt.Scale.Micro);
  }
  /**
   * Rescale to nano (1e9).
   *
   * @returns A new `SafeInt<SafeInt.Scale.Nano>`.
   *
   * @docs
   */
  nano() {
    return this.to_scale(SafeInt.Scale.Nano);
  }
  /**
   * Rescale to pico (1e12).
   *
   * @returns A new `SafeInt<SafeInt.Scale.Pico>`.
   *
   * @docs
   */
  pico() {
    return this.to_scale(SafeInt.Scale.Pico);
  }
  // ----------------------------------------------------------------
  // arithmetic — same-scale only
  // ----------------------------------------------------------------
  /**
   * Add an amount at the same scale.
   *
   * @param other The addend, as a raw safe integer or a `SafeInt<S>`.
   * @returns     A new `SafeInt<S>` with the sum.
   *
   * @throws Error If the operand is invalid.
   *
   * @docs
   */
  add(other) {
    const b = typeof other === "number" ? Number.isSafeInteger(other) ? BigInt(other) : (() => {
      throw new Error(`Invalid 'addend': expected a safe integer, got ${other}`);
    })() : typeof other === "bigint" ? other : other.int_value;
    const sum = this.int_value + b;
    return new SafeInt(sum, this.int_scale);
  }
  /**
   * Subtract an amount at the same scale.
   *
   * @param other The subtrahend, as a raw safe integer or a `SafeInt<S>`.
   * @returns     A new `SafeInt<S>` with the difference.
   *
   * @throws Error If the operand is invalid.
   *
   * @docs
   */
  sub(other) {
    const b = typeof other === "number" ? Number.isSafeInteger(other) ? BigInt(other) : (() => {
      throw new Error(`Invalid 'subtrahend': expected a safe integer, got ${other}`);
    })() : typeof other === "bigint" ? other : other.int_value;
    const diff = this.int_value - b;
    return new SafeInt(diff, this.int_scale);
  }
  /**
   * Multiply by an integer factor at the same scale.
   *
   * @param factor The factor as a raw safe integer or a `SafeInt<S>`.
   * @returns      A new `SafeInt<S>` with the product.
   *
   * @throws Error If the factor is invalid.
   *
   * @docs
   */
  mul(factor) {
    const f = typeof factor === "number" ? Number.isSafeInteger(factor) ? BigInt(factor) : (() => {
      throw new Error(`Invalid 'factor': expected a safe integer, got ${factor}`);
    })() : typeof factor === "bigint" ? factor : factor.int_value;
    const product = this.int_value * f;
    return new SafeInt(product, this.int_scale);
  }
  /**
   * Divide by a positive integer divisor at the same scale.
   *
   * @param divisor Positive safe integer or `SafeInt<S>` divisor.
   * @param round    Rounding mode. Default `"exact"` requires no remainder.
   * @returns       A new `SafeInt<S>` with the integer quotient (per {@link round}).
   *
   * @throws Error If the divisor is invalid, division by zero, or non-exact remainder in `"exact"` round.
   *
   * @docs
   */
  div(divisor, round = "exact") {
    const d = typeof divisor === "number" ? Number.isSafeInteger(divisor) ? BigInt(divisor) : (() => {
      throw new Error(`Invalid 'divisor': expected a non-zero safe integer, got ${divisor}`);
    })() : typeof divisor === "bigint" ? divisor : divisor.int_value;
    if (d === 0n) {
      throw new Error(`Invalid 'divisor': expected a non-zero safe integer, got 0`);
    }
    const q = SafeInt.div_int_checked(this.int_value, d, round);
    return new SafeInt(q, this.int_scale);
  }
  // ----------------------------------------------------------------
  // comparisons — same-scale only
  // ----------------------------------------------------------------
  /**
   * Compare with another `SafeInt<S>`.
   *
   * @param other The other amount (same scale).
   * @returns     `-1` if this < other, `0` if equal, `1` if this > other.
   *
   * @docs
   */
  cmp(other) {
    const rhs = other.int_value;
    if (this.int_value < rhs)
      return -1;
    if (this.int_value > rhs)
      return 1;
    return 0;
  }
  /**
   * Test equality with another `SafeInt<S>`.
   *
   * @param other The other amount (same scale).
   * @returns     `true` if equal, otherwise `false`.
   *
   * @docs
   */
  eq(other) {
    return this.cmp(other) === 0;
  }
  // ----------------------------------------------------------------
  // Member & static assertions.
  // ----------------------------------------------------------------
  /**
   * Assert `value` is a `>=0` integer.
   *
   * @docs
   */
  assert_non_negative() {
    if (this.int_value < 0n) {
      throw new Error(`Invalid value: expected non-negative integer, got ${this.int_value.toString()}`);
    }
  }
  /**
   * Assert `value` is a `>0` integer.
   *
   * @docs
   */
  assert_positive() {
    if (this.int_value <= 0n) {
      throw new Error(`Invalid value: expected positive integer, got ${this.int_value.toString()}`);
    }
  }
  /**
   * Assert `value` is a `<=0` integer.
   *
   * @docs
   */
  assert_non_positive() {
    if (this.int_value > 0n) {
      throw new Error(`Invalid value: expected non-positive integer, got ${this.int_value.toString()}`);
    }
  }
  /**
   * Assert `value` is a `<0` integer.
   *
   * @docs
   */
  assert_negative() {
    if (this.int_value >= 0n) {
      throw new Error(`Invalid value: expected negative integer, got ${this.int_value.toString()}`);
    }
  }
  /**
   * Assert `value` is a `>=0` safe integer.
   *
   * @docs
   */
  static assert_non_negative(value, label) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Invalid '${label}': expected non-negative safe integer, got ${value}`);
    }
  }
  /**
   * Assert `value` is a `>0` safe integer.
   *
   * @docs
   */
  static assert_positive(value, label) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`Invalid '${label}': expected positive safe integer, got ${value}`);
    }
  }
  /**
   * Assert `value` is a `<=0` safe integer.
   *
   * @docs
   */
  static assert_non_positive(value, label) {
    if (!Number.isSafeInteger(value) || value > 0) {
      throw new Error(`Invalid '${label}': expected non-positive safe integer, got ${value}`);
    }
  }
  /**
   * Assert `value` is a `<0` safe integer.
   *
   * @docs
   */
  static assert_negative(value, label) {
    if (!Number.isSafeInteger(value) || value >= 0) {
      throw new Error(`Invalid '${label}': expected negative safe integer, got ${value}`);
    }
  }
  // ----------------------------------------------------------------
  // static helpers (internal)
  // ----------------------------------------------------------------
  /**
   * Apply a rounding to a floating value.
   *
   * @param v    Floating value to round.
   * @param round Rounding mode.
   * @returns    Rounded integer (validated by the caller).
   * @internal
   */
  static apply_round(v, round) {
    if (!Number.isFinite(v))
      throw new Error(`Invalid value for rounding: ${v}`);
    if (round === "floor")
      return Math.floor(v);
    if (round === "ceil")
      return Math.ceil(v);
    if (round === "round")
      return Math.round(v);
    throw new Error(`apply_round() called with round='exact' which forbids rounding`);
  }
  /**
   * Parse an integer string into bigint.
   * - Allows optional leading +/-.
   * - Allows underscores as separators.
   * - Rejects decimals.
   *
   * @internal
   */
  static parse_int_str(text, label) {
    const s = text.trim().replace(/_/g, "");
    if (s.length === 0)
      throw new Error(`Invalid '${label}': empty string`);
    if (!/^[+-]?\d+$/.test(s)) {
      throw new Error(`Invalid '${label}': expected integer string, got '${text}'`);
    }
    return BigInt(s);
  }
  /**
   * Parse a base-scale decimal string and convert to an integer at `to_scale` using bigint math.
   *
   * Examples:
   *  "1.5" with to_scale=1000 => 1500
   *  "-0.001" with to_scale=1000 => -1
   *
   * - Underscores are allowed.
   * - Exact by default; non-exact requires a rounding mode.
   *
   * @internal
   */
  static parse_base_decimal_to_scaled(text, to_scale, round) {
    const raw = text.trim().replace(/_/g, "");
    if (raw.length === 0)
      throw new Error(`Invalid 'value': empty string`);
    let sign = 1n;
    let s = raw;
    if (s[0] === "+")
      s = s.slice(1);
    else if (s[0] === "-") {
      sign = -1n;
      s = s.slice(1);
    }
    if (s.length === 0)
      throw new Error(`Invalid 'value': expected digits, got '${text}'`);
    const parts = s.split(".");
    if (parts.length > 2)
      throw new Error(`Invalid 'value': too many decimal points in '${text}'`);
    const int_part = parts[0] === "" ? "0" : parts[0];
    const frac_part = parts.length === 2 ? parts[1] ?? "" : "";
    if (!/^\d+$/.test(int_part)) {
      throw new Error(`Invalid 'value': invalid integer part in '${text}'`);
    }
    if (frac_part !== "" && !/^\d+$/.test(frac_part)) {
      throw new Error(`Invalid 'value': invalid fractional part in '${text}'`);
    }
    const k = frac_part.length;
    const denom = k === 0 ? 1n : SafeInt.pow10(k);
    const whole = BigInt(int_part);
    const frac = frac_part === "" ? 0n : BigInt(frac_part);
    const numerator = (whole * denom + frac) * sign;
    const scaled_num = numerator * BigInt(to_scale);
    return SafeInt.div_int_checked(scaled_num, denom, round);
  }
  /**
   * Compute 10^n as bigint.
   * @internal
   */
  static pow10(n) {
    if (!Number.isSafeInteger(n) || n < 0) {
      throw new Error(`Invalid pow10 exponent: ${n}`);
    }
    if (n > 1e3) {
      throw new Error(`Invalid decimal precision: ${n} (too large)`);
    }
    return BigInt("1" + "0".repeat(n));
  }
  /**
   * Convert integer-scale value → base **integer** using a rounding policy.
   *
   * @param value      Integer at `from_scale` (may be negative).
   * @param from_scale Source scale.
   * @param round       Rounding (default exact).
   * @returns          Base-scale integer.
   * @internal
   */
  static div_to_base(value, from_scale, round) {
    const denom = BigInt(from_scale);
    if (round === "exact") {
      if (value % denom !== 0n) {
        throw new Error(`Exact conversion to base failed: ${value.toString()} % ${from_scale} !== 0`);
      }
      return value / denom;
    }
    return SafeInt.div_int_checked(value, denom, round);
  }
  /**
   * Integer division helper with selectable rounding semantics.
   *
   * @param numerator   Integer (may be negative).
   * @param denominator Positive integer.
   * @param round        Rounding mode (default `"exact"`).
   * @returns           Integer quotient as per {@link round}.
   *
   * @throws Error On invalid inputs, division by zero, or non-exact remainder in `"exact"`.
   * @internal
   */
  static div_int_checked(numerator, denominator, round = "exact") {
    if (denominator <= 0n)
      throw new Error(`Invalid denominator: ${denominator.toString()}`);
    const q = numerator / denominator;
    const rem = numerator % denominator;
    if (round === "exact") {
      if (rem !== 0n)
        throw new Error(`Non-exact division: ${numerator.toString()} / ${denominator.toString()} leaves remainder ${rem.toString()}`);
      return q;
    }
    if (rem === 0n)
      return q;
    if (round === "floor") {
      return numerator < 0n ? q - 1n : q;
    }
    if (round === "ceil") {
      return numerator > 0n ? q + 1n : q;
    }
    if (round === "round") {
      const absRem = rem < 0n ? -rem : rem;
      const twice = absRem * 2n;
      if (twice < denominator)
        return q;
      return numerator >= 0n ? q + 1n : q - 1n;
    }
    throw new Error(`Invalid round: ${round}`);
  }
  /**
   * Integer-only scale converter with rounding policy.
   *
   * @param value       Integer at {@link from_scale} (may be negative).
   * @param from_scale  Integer source scale.
   * @param to_scale    Integer target scale.
   * @param round        Rounding mode (default exact).
   * @returns           Integer at `to_scale`.
   *
   * @throws Error On invalid inputs.
   * @internal
   */
  static convert_int_scale(value, from_scale, to_scale, round) {
    if (!Number.isSafeInteger(from_scale) || from_scale <= 0) {
      throw new Error(`Invalid from_scale: expected positive safe integer, got ${from_scale}`);
    }
    if (!Number.isSafeInteger(to_scale) || to_scale <= 0) {
      throw new Error(`Invalid to_scale: expected positive safe integer, got ${to_scale}`);
    }
    if (from_scale === to_scale)
      return value;
    if (from_scale % to_scale === 0) {
      const divisor = BigInt(Math.trunc(from_scale / to_scale));
      return SafeInt.div_int_checked(value, divisor, round);
    }
    if (to_scale % from_scale === 0) {
      const multiplier = BigInt(Math.trunc(to_scale / from_scale));
      return value * multiplier;
    }
    const numerator = value * BigInt(to_scale);
    return SafeInt.div_int_checked(numerator, BigInt(from_scale), round);
  }
}
(function(SafeInt2) {
  let Scale;
  (function(Scale2) {
    Scale2[Scale2["Base"] = 1] = "Base";
    Scale2[Scale2["Milli"] = 1e3] = "Milli";
    Scale2[Scale2["Micro"] = 1e6] = "Micro";
    Scale2[Scale2["Nano"] = 1e9] = "Nano";
    Scale2[Scale2["Pico"] = 1e12] = "Pico";
  })(Scale = SafeInt2.Scale || (SafeInt2.Scale = {}));
  function str_to_scale(scale) {
    switch (scale) {
      case "base":
        return Scale.Base;
      case "milli":
        return Scale.Milli;
      case "micro":
        return Scale.Micro;
      case "nano":
        return Scale.Nano;
      case "pico":
        return Scale.Pico;
      default:
        throw new Error(`Unknown scale: ${scale}`);
    }
  }
  SafeInt2.str_to_scale = str_to_scale;
})(SafeInt || (SafeInt = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SafeInt
});
