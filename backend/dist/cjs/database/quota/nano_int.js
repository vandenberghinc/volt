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
  NanoInt: () => NanoInt
});
module.exports = __toCommonJS(stdin_exports);
class NanoInt {
  // ----------------------------------------------------------------
  // Fields
  // ----------------------------------------------------------------
  /**
   * The internal nano-scale value.
   * Always a non-negative, safe integer at {@link NanoInt.Scale.Nano}.
   */
  nano_val;
  constructor(a, b) {
    if (b === void 0) {
      NanoInt.assert_nano_int("nano_val", a);
      this.nano_val = a;
    } else {
      const nano = NanoInt.to_scale(a, b, NanoInt.Scale.Nano);
      NanoInt.assert_nano_int("converted_nano_val", nano);
      this.nano_val = nano;
    }
  }
  // ----------------------------------------------------------------
  // Value accessors
  // ----------------------------------------------------------------
  /**
   * Retrieve the underlying nano-scale value as a number.
   *
   * @returns The stored non-negative safe integer at nano scale.
   */
  value() {
    return this.nano_val;
  }
  /**
   * Alias of {@link value}. Provided for JavaScript numeric coercion.
   *
   * @returns The stored non-negative safe integer at nano scale.
   */
  valueOf() {
    return this.nano_val;
  }
  /**
   * Alias of {@link value}. Semantic name for clarity.
   *
   * @returns The stored non-negative safe integer at nano scale.
   */
  nano() {
    return this.nano_val;
  }
  // ----------------------------------------------------------------
  // Conversions
  // ----------------------------------------------------------------
  /**
   * Convert to base scale (1) as a floating-point number.
   *
   * @returns The amount in base scale (presentation float).
   */
  to_base() {
    return NanoInt.to_scale(this.nano_val, NanoInt.Scale.Nano, NanoInt.Scale.Base);
  }
  /**
   * Convert to any other target scale.
   *
   * Behavior:
   * - If `to_scale === 1`, returns a float (same as {@link to_base}).
   * - If `to_scale` is a positive integer, returns a safe integer at that scale
   *   using {@link mode} for non-exact ratios.
   *
   * @param to_scale The target scale (e.g., 1_000_000 for “micro”).
   * @param mode     Rounding mode for non-exact conversions (default: "round").
   * @returns        The value at the requested scale.
   * @throws         Error if inputs are invalid or arithmetic would overflow.
   */
  to_scale(to_scale, mode = "round") {
    if (!Number.isFinite(to_scale) || to_scale <= 0) {
      throw new Error(`Invalid 'to_scale': ${to_scale}. Must be a positive finite number.`);
    }
    if (to_scale === NanoInt.Scale.Base) {
      return this.to_base();
    }
    return NanoInt.convert_int_scale(this.nano_val, NanoInt.Scale.Nano, to_scale, mode);
  }
  // ----------------------------------------------------------------
  // Arithmetic — objective methods returning new NanoInt
  // ----------------------------------------------------------------
  /**
   * Add a nano-scale integer or another {@link NanoInt}, returning a new instance.
   *
   * @param other The addend: a non-negative safe integer (nano) or another {@link NanoInt}.
   * @returns     A new {@link NanoInt} with the summed nano value.
   * @throws      Error if inputs are invalid or overflow occurs.
   */
  add(other) {
    const b = other instanceof NanoInt ? other.nano_val : other;
    NanoInt.assert_non_negative_safe_int("addend", b);
    const s = NanoInt.safe_add_int(this.nano_val, b, "NanoInt.add()");
    return new NanoInt(s);
  }
  /**
   * Subtract a nano-scale integer or another {@link NanoInt}, returning a new instance.
   *
   * @param other The subtrahend: a non-negative safe integer (nano) or another {@link NanoInt}.
   * @returns     A new {@link NanoInt} with the difference.
   * @throws      Error if inputs are invalid, overflow occurs, or the result would be negative.
   */
  sub(other) {
    const b = other instanceof NanoInt ? other.nano_val : other;
    NanoInt.assert_non_negative_safe_int("subtrahend", b);
    const diff = NanoInt.safe_add_int(this.nano_val, -b, "NanoInt.sub()");
    if (diff < 0) {
      throw new Error(`Underflow in NanoInt.sub(): result would be negative (${this.nano_val} - ${b})`);
    }
    return new NanoInt(diff);
  }
  /**
   * Multiply by a non-negative safe integer factor, returning a new instance.
   *
   * @param factor A non-negative safe integer multiplier.
   * @returns      A new {@link NanoInt} with the product.
   * @throws       Error if inputs are invalid or overflow occurs.
   */
  mul(factor) {
    const b = factor instanceof NanoInt ? factor.nano_val : factor;
    NanoInt.assert_non_negative_safe_int("factor", b);
    const product = NanoInt.safe_mul_int(this.nano_val, b);
    return new NanoInt(product);
  }
  /**
   * Divide by a positive safe integer divisor with explicit rounding, returning a new instance.
   *
   * @param divisor A positive safe integer divisor.
   * @param mode    Rounding mode (default: "exact").
   * @returns       A new {@link NanoInt} with the quotient (still nano scale).
   * @throws        Error on invalid inputs, division by zero, non-exact remainder in "exact" mode, or overflow.
   */
  div(divisor, mode = "exact") {
    const b = divisor instanceof NanoInt ? divisor.nano_val : divisor;
    NanoInt.assert_non_negative_safe_int("divisor", b);
    if (!Number.isSafeInteger(b) || b <= 0) {
      throw new Error(`Invalid 'divisor': expected positive safe integer, got ${b}`);
    }
    const q = NanoInt.safe_div_int(this.nano_val, b, mode);
    return new NanoInt(q);
  }
  // ----------------------------------------------------------------
  // Public static helpers
  // ----------------------------------------------------------------
  /**
   * Assert a value is a non-negative safe integer at nano scale.
   *
   * @param label  Label for diagnostics.
   * @param value  The value to assert.
   * @param prefix Optional message prefix.
   * @throws       Error if the assertion fails.
   */
  static assert_nano_int(label, value, prefix) {
    if (!Number.isInteger(value) || !Number.isSafeInteger(value) || value < 0) {
      throw new Error(`${prefix ?? ""}Invalid ${label}: expected non-negative safe integer at nano scale, got ${value}`);
    }
  }
  /**
   * Convert between base (1) and nano (1e9) with validation and overflow checks,
   * plus generic integer-scale conversions.
   *
   * Semantics:
   * - Base ➜ Nano: rounds to nearest; returns safe integer.
   * - Nano ➜ Base: requires safe integer input; returns float.
   * - Same scale: returns validated input.
   * - Other integer scales: uses exact mult/div if possible, otherwise (value * to_scale) / from_scale with rounding.
   *
   * @param value      The input value.
   * @param from_scale The input scale.
   * @param to_scale   The target scale.
   * @returns          The converted amount.
   * @throws           Error if invalid or overflows.
   */
  static to_scale(value, from_scale, to_scale) {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid 'value': ${value}`);
    }
    if (from_scale === to_scale) {
      if (to_scale === NanoInt.Scale.Base) {
        return value;
      }
      if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
        throw new Error(`Expected safe integer at scale=${to_scale}, got ${value}`);
      }
      return value;
    }
    if (from_scale === NanoInt.Scale.Base && to_scale === NanoInt.Scale.Nano) {
      const n = Math.round(value * NanoInt.Scale.Nano);
      if (!Number.isSafeInteger(n))
        throw new Error(`Overflow converting to nano: ${value}`);
      return n;
    }
    if (from_scale === NanoInt.Scale.Nano && to_scale === NanoInt.Scale.Base) {
      if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
        throw new Error(`Expected safe integer at nano scale, got ${value}`);
      }
      return value / NanoInt.Scale.Nano;
    }
    if (!Number.isInteger(from_scale) || !Number.isInteger(to_scale) || from_scale <= 0 || to_scale <= 0) {
      throw new Error(`Generic conversion only supports positive integer scales. from_scale=${from_scale}, to_scale=${to_scale}`);
    }
    return NanoInt.convert_int_scale(from_scale === NanoInt.Scale.Base ? Math.round(value) : value, from_scale, to_scale, "round");
  }
  // ----------------------------------------------------------------
  // static helpers — not part of the public API surface
  // ----------------------------------------------------------------
  /**
   * Assert a generic non-negative safe integer (used for operands).
   *
   * @param label Label for diagnostics.
   * @param v     The value to validate.
   * @throws      Error if invalid.
   */
  static assert_non_negative_safe_int(label, v) {
    if (!Number.isSafeInteger(v) || v < 0) {
      throw new Error(`Invalid ${label}: expected non-negative safe integer, got ${v}`);
    }
  }
  /**
   * Safely add two safe integers with overflow checking.
   *
   * @param a     First operand (safe integer).
   * @param b     Second operand (safe integer; may be negative).
   * @param label Label used in error messages.
   * @returns     The safe-integer sum.
   * @throws      Error if inputs are invalid or overflow occurs.
   */
  static safe_add_int(a, b, label) {
    if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
      throw new Error(`Invalid operands for ${label}: expected safe integers, got a=${a}, b=${b}`);
    }
    const s = a + b;
    if (!Number.isSafeInteger(s)) {
      throw new Error(`Overflow adding ${label}: ${a} + ${b} = ${s}`);
    }
    return s;
  }
  /**
   * Safely multiply two non-negative safe integers.
   *
   * @param a Non-negative safe integer multiplicand.
   * @param b Non-negative safe integer multiplier.
   * @returns The safe-integer product.
   * @throws  Error if inputs are invalid or overflow occurs.
   */
  static safe_mul_int(a, b) {
    if (!Number.isSafeInteger(a) || a < 0) {
      throw new Error(`Invalid multiplicand: expected non-negative safe integer, got ${a}`);
    }
    if (!Number.isSafeInteger(b) || b < 0) {
      throw new Error(`Invalid multiplier: expected non-negative safe integer, got ${b}`);
    }
    const p = a * b;
    if (!Number.isSafeInteger(p)) {
      throw new Error(`Overflow in multiplication: ${a} * ${b} = ${p}`);
    }
    return p;
  }
  /**
   * Safely divide two non-negative safe integers with explicit rounding.
   *
   * @param numerator   Non-negative safe-integer numerator.
   * @param denominator Positive safe-integer denominator.
   * @param mode        Rounding mode (default: "exact").
   * @returns           Safe-integer quotient according to {@link mode}.
   * @throws            Error on invalid inputs, division by zero, non-exact remainder in "exact" mode, or overflow.
   */
  static safe_div_int(numerator, denominator, mode = "exact") {
    if (!Number.isSafeInteger(numerator) || numerator < 0) {
      throw new Error(`Invalid 'numerator': expected non-negative safe integer, got ${numerator}`);
    }
    if (!Number.isSafeInteger(denominator) || denominator <= 0) {
      throw new Error(`Invalid 'denominator': expected positive safe integer, got ${denominator}`);
    }
    const q = Math.trunc(numerator / denominator);
    const prod = q * denominator;
    if (!Number.isSafeInteger(prod)) {
      throw new Error(`Overflow computing remainder in division`);
    }
    const rem = numerator - prod;
    if (mode === "exact") {
      if (rem !== 0) {
        throw new Error(`Non-exact division: ${numerator} / ${denominator} leaves remainder ${rem}`);
      }
      return q;
    }
    if (mode === "floor") {
      return q;
    }
    if (mode === "ceil") {
      return rem === 0 ? q : NanoInt.safe_add_int(q, 1, "ceil increment");
    }
    if (mode === "round") {
      const twice = rem * 2;
      if (!Number.isSafeInteger(twice))
        throw new Error(`Overflow computing rounding threshold`);
      if (twice >= denominator) {
        const qp1 = q + 1;
        if (!Number.isSafeInteger(qp1))
          throw new Error(`Overflow rounding quotient`);
        return qp1;
      }
      return q;
    }
    throw new Error(`Invalid 'mode' for division: ${mode}`);
  }
  /**
   * Generic, integer-only scale converter with rounding.
   *
   * @param value       A safe integer at {@link from_scale}.
   * @param from_scale  Integer scale of {@link value}.
   * @param to_scale    Integer target scale.
   * @param mode        Rounding mode for non-exact ratios.
   * @returns           Safe integer at {@link to_scale}.
   * @throws            Error on invalid inputs or overflow.
   */
  static convert_int_scale(value, from_scale, to_scale, mode) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Invalid 'value' for convert_int_scale(): expected non-negative safe integer, got ${value}`);
    }
    if (!Number.isSafeInteger(from_scale) || from_scale <= 0) {
      throw new Error(`Invalid 'from_scale': ${from_scale}`);
    }
    if (!Number.isSafeInteger(to_scale) || to_scale <= 0) {
      throw new Error(`Invalid 'to_scale': ${to_scale}`);
    }
    if (from_scale === to_scale)
      return value;
    if (from_scale % to_scale === 0) {
      const divisor = Math.trunc(from_scale / to_scale);
      return NanoInt.safe_div_int(value, divisor, mode);
    }
    if (to_scale % from_scale === 0) {
      const multiplier = Math.trunc(to_scale / from_scale);
      return NanoInt.safe_mul_int(value, multiplier);
    }
    const numerator = NanoInt.safe_mul_int(value, to_scale);
    return NanoInt.safe_div_int(numerator, from_scale, mode);
  }
}
(function(NanoInt2) {
  let Scale;
  (function(Scale2) {
    Scale2[Scale2["Base"] = 1] = "Base";
    Scale2[Scale2["Nano"] = 1e9] = "Nano";
  })(Scale = NanoInt2.Scale || (NanoInt2.Scale = {}));
})(NanoInt || (NanoInt = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NanoInt
});
