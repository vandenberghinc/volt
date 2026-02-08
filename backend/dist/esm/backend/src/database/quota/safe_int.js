/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
/* ============================================================================
   SafeInt — a single, generic, integer-only amount class
   ----------------------------------------------------------------------------
   - **No derived classes.** A single generic class parameterized by its scale `S`.
   - **Exact-by-default.** No silent rounding anywhere; rounding only when `round` is provided.
   - **Same-scale arithmetic only.** Operations accept raw numbers or the same generic `SafeInt<S>`.
   - **Strong typing for rescaling.** `to_scale<T>()` and helpers (`base/milli/micro/nano/pico`)
     return `SafeInt<T>` with the correct type at compile time.
   - **Constructor defaults to Base scale.** Multiple signatures are provided as requested.
   ========================================================================== */
/**
 * Scaled, integer-only amount with explicit, type-safe scale semantics.
 *
 * @template S The canonical integer scale (see {@link SafeInt.Scale}) at which this instance stores its value.
 *
 * @remarks
 * - The stored value is always a **safe JavaScript integer** (may be negative) measured in units of `S`.
 * - Instances are **immutable**; all arithmetic returns new `SafeInt` instances.
 * - Conversions are **exact by default**. Provide a {@link SafeInt.Rounding} `round` to allow rounding.
 * - Arithmetic is **same-scale only**: pass raw integers or another `SafeInt<S>`.
 *
 * @nav Database
 * @docs
 */
export class SafeInt {
    // ----------------------------------------------------------------
    // Fields
    // ----------------------------------------------------------------
    /**
     * The stored safe integer (may be negative) measured at {@link int_scale}.
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
     *
     * @throws
     * Error If inputs are invalid, conversion overflows, or exactness is required but not met.
     *
     * @docs
     */
    constructor(value, opts) {
        // Already-at-scale (exact)
        if (typeof opts === "number" || typeof opts === "string") {
            const scale = typeof opts === "string"
                ? SafeInt.str_to_scale(opts)
                : opts;
            // validate scale (must be a positive safe integer)
            if (!Number.isSafeInteger(scale) || scale <= 0) {
                throw new Error(`Invalid scale: expected positive safe integer, got ${scale}`);
            }
            // value can be any safe integer (negative allowed)
            if (!Number.isSafeInteger(value)) {
                throw new Error(`Invalid value: expected safe integer, got ${value}`);
            }
            this.int_value = value;
            this.int_scale = scale;
            return;
        }
        // Convert from -> to (exact by default; optional rounding)
        let { to_scale, from_scale = SafeInt.Scale.Base, round = "exact" } = opts;
        if (typeof to_scale === "string") {
            to_scale = SafeInt.str_to_scale(to_scale);
        }
        if (typeof from_scale === "string") {
            from_scale = SafeInt.str_to_scale(from_scale);
        }
        // validate scales (must be positive safe integers)
        if (!Number.isSafeInteger(from_scale) || from_scale <= 0) {
            throw new Error(`Invalid from_scale: expected positive safe integer, got ${from_scale}`);
        }
        if (!Number.isSafeInteger(to_scale) || to_scale <= 0) {
            throw new Error(`Invalid to_scale: expected positive safe integer, got ${to_scale}`);
        }
        let converted;
        if (from_scale === to_scale) {
            if (to_scale === SafeInt.Scale.Base) {
                if (round === "exact") {
                    if (!Number.isSafeInteger(value)) {
                        throw new Error(`Exact constructor requires integer at base scale, got ${value}`);
                    }
                    converted = value;
                }
                else {
                    const rounded = SafeInt.apply_round(value, round);
                    if (!Number.isSafeInteger(rounded)) {
                        throw new Error(`Rounding produced non-integer at base scale: ${rounded}`);
                    }
                    converted = rounded;
                }
            }
            else {
                if (!Number.isSafeInteger(value)) {
                    throw new Error(`Invalid value: expected safe integer at scale=${to_scale}, got ${value}`);
                }
                converted = value;
            }
        }
        else if (from_scale === SafeInt.Scale.Base) {
            // base -> integer scale
            const product = value * to_scale;
            if (round === "exact") {
                if (!Number.isFinite(product) || !Number.isInteger(product)) {
                    throw new Error(`Exact conversion failed: ${value} * ${to_scale} is not an integer`);
                }
                if (!Number.isSafeInteger(product)) {
                    throw new Error(`Overflow converting base->${to_scale}: ${product}`);
                }
                converted = product;
            }
            else {
                const rounded = SafeInt.apply_round(product, round);
                if (!Number.isSafeInteger(rounded)) {
                    throw new Error(`Overflow/invalid rounding converting base->${to_scale}: ${product} -> ${rounded}`);
                }
                converted = rounded;
            }
        }
        else if (to_scale === SafeInt.Scale.Base) {
            // integer scale -> base integer, possibly rounded
            if (!Number.isSafeInteger(value)) {
                throw new Error(`Invalid value: expected safe integer at scale=${from_scale}, got ${value}`);
            }
            converted = SafeInt.div_to_base(value, from_scale, round);
        }
        else {
            // integer-scale -> integer-scale
            if (!Number.isSafeInteger(value)) {
                throw new Error(`Invalid value: expected safe integer at scale=${from_scale}, got ${value}`);
            }
            converted = SafeInt.convert_int_scale(value, from_scale, to_scale, round);
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
     * @returns The stored safe integer.
     *
     * @docs
     */
    value() {
        return this.int_value;
    }
    /**
     * Alias of {@link value}. Provided for JavaScript numeric coercion.
     *
     * @returns The stored safe integer.
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
            return this.int_value;
        return this.int_value / this.int_scale;
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
        // validate target scale
        if (!Number.isSafeInteger(to_scale) || to_scale <= 0) {
            throw new Error(`Invalid to_scale: expected positive safe integer, got ${to_scale}`);
        }
        if (this.int_scale === to_scale) {
            // Preserve type at call-site
            return new SafeInt(this.int_value, to_scale);
        }
        if (to_scale === SafeInt.Scale.Base) {
            const base_int = SafeInt.div_to_base(this.int_value, this.int_scale, round);
            return new SafeInt(base_int, SafeInt.Scale.Base);
        }
        if (this.int_scale === SafeInt.Scale.Base) {
            const product = this.int_value * to_scale;
            if (!Number.isSafeInteger(product)) {
                throw new Error(`Overflow converting base->${to_scale}`);
            }
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
     * @throws Error If the operand is invalid or the sum overflows.
     *
     * @docs
     */
    add(other) {
        const b = typeof other === "number" ? other : other.int_value;
        if (!Number.isSafeInteger(b)) {
            throw new Error(`Invalid 'addend': expected a safe integer, got ${b}`);
        }
        const sum = this.int_value + b;
        if (!Number.isSafeInteger(sum)) {
            throw new Error(`Overflow in add(): ${this.int_value} + ${b} = ${sum}`);
        }
        return new SafeInt(sum, this.int_scale);
    }
    /**
     * Subtract an amount at the same scale.
     *
     * @param other The subtrahend, as a raw safe integer or a `SafeInt<S>`.
     * @returns     A new `SafeInt<S>` with the difference.
     *
     * @throws Error If the operand is invalid or subtraction overflows.
     *
     * @docs
     */
    sub(other) {
        const b = typeof other === "number" ? other : other.int_value;
        if (!Number.isSafeInteger(b)) {
            throw new Error(`Invalid 'subtrahend': expected a safe integer, got ${b}`);
        }
        const diff = this.int_value - b;
        if (!Number.isSafeInteger(diff)) {
            throw new Error(`Overflow in sub(): ${this.int_value} - ${b} = ${diff}`);
        }
        return new SafeInt(diff, this.int_scale);
    }
    /**
     * Multiply by an integer factor at the same scale.
     *
     * @param factor The factor as a raw safe integer or a `SafeInt<S>`.
     * @returns      A new `SafeInt<S>` with the product.
     *
     * @throws Error If the factor is invalid or the product overflows.
     *
     * @docs
     */
    mul(factor) {
        const f = typeof factor === "number" ? factor : factor.int_value;
        if (!Number.isSafeInteger(f)) {
            throw new Error(`Invalid 'factor': expected a safe integer, got ${f}`);
        }
        const product = this.int_value * f;
        if (!Number.isSafeInteger(product)) {
            throw new Error(`Overflow in mul(): ${this.int_value} * ${f} = ${product}`);
        }
        return new SafeInt(product, this.int_scale);
    }
    /**
     * Divide by a positive integer divisor at the same scale.
     *
     * @param divisor Positive safe integer or `SafeInt<S>` divisor.
     * @param round    Rounding mode. Default `"exact"` requires no remainder.
     * @returns       A new `SafeInt<S>` with the integer quotient (per {@link round}).
     *
     * @throws Error If the divisor is invalid, division by zero, non-exact remainder in `"exact"` round, or overflow.
     *
     * @docs
     */
    div(divisor, round = "exact") {
        const d = typeof divisor === "number" ? divisor : divisor.int_value;
        if (!Number.isSafeInteger(d) || d === 0) {
            throw new Error(`Invalid 'divisor': expected a non-zero safe integer, got ${d}`);
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
     * Assert `value` is a `>=0` safe integer.
     *
     * @docs
     */
    assert_non_negative() {
        if (!Number.isSafeInteger(this.int_value) || this.int_value < 0) {
            throw new Error(`Invalid value: expected non-negative safe integer, got ${this.int_value}`);
        }
    }
    /**
     * Assert `value` is a `>0` safe integer.
     *
     * @docs
     */
    assert_positive() {
        if (!Number.isSafeInteger(this.int_value) || this.int_value <= 0) {
            throw new Error(`Invalid value: expected positive safe integer, got ${this.int_value}`);
        }
    }
    /**
     * Assert `value` is a `<=0` safe integer.
     *
     * @docs
     */
    assert_non_positive() {
        if (!Number.isSafeInteger(this.int_value) || this.int_value > 0) {
            throw new Error(`Invalid value: expected non-positive safe integer, got ${this.int_value}`);
        }
    }
    /**
     * Assert `value` is a `<0` safe integer.
     *
     * @docs
     */
    assert_negative() {
        if (!Number.isSafeInteger(this.int_value) || this.int_value >= 0) {
            throw new Error(`Invalid value: expected negative safe integer, got ${this.int_value}`);
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
     * Convert integer-scale value → base **integer** using a rounding policy.
     *
     * @param value      Safe integer at `from_scale` (may be negative).
     * @param from_scale Source scale.
     * @param round       Rounding (default exact).
     * @returns          Base-scale integer.
     * @internal
     */
    static div_to_base(value, from_scale, round) {
        if (round === "exact") {
            if (value % from_scale !== 0) {
                throw new Error(`Exact conversion to base failed: ${value} % ${from_scale} !== 0`);
            }
            return value / from_scale;
        }
        return SafeInt.div_int_checked(value, from_scale, round);
    }
    /**
     * Integer division helper with selectable rounding semantics.
     *
     * @param numerator   Safe integer (may be negative).
     * @param denominator Positive safe integer.
     * @param round        Rounding mode (default `"exact"`).
     * @returns           Integer quotient as per {@link round}.
     *
     * @throws Error On invalid inputs, division by zero, non-exact remainder in `"exact"`, or overflow.
     * @internal
     */
    static div_int_checked(numerator, denominator, round = "exact") {
        if (!Number.isSafeInteger(numerator))
            throw new Error(`Invalid numerator: ${numerator}`);
        if (!Number.isSafeInteger(denominator) || denominator <= 0)
            throw new Error(`Invalid denominator: ${denominator}`);
        const q = Math.trunc(numerator / denominator);
        const prod = q * denominator;
        if (!Number.isSafeInteger(prod))
            throw new Error(`Overflow computing remainder`);
        const rem = numerator - prod;
        if (round === "exact") {
            if (rem !== 0)
                throw new Error(`Non-exact division: ${numerator} / ${denominator} leaves remainder ${rem}`);
            return q;
        }
        if (round === "floor")
            return q; // truncate toward zero by design
        if (round === "ceil")
            return rem === 0 ? q : (q + 1);
        if (round === "round") {
            const twice = rem * 2;
            if (!Number.isSafeInteger(twice))
                throw new Error(`Overflow computing rounding threshold`);
            return twice >= denominator ? (q + 1) : q;
        }
        throw new Error(`Invalid round: ${round}`);
    }
    /**
     * Integer-only scale converter with rounding policy.
     *
     * @param value       Safe integer at {@link from_scale} (may be negative).
     * @param from_scale  Integer source scale.
     * @param to_scale    Integer target scale.
     * @param round        Rounding mode (default exact).
     * @returns           Safe integer at `to_scale`.
     *
     * @throws Error On invalid inputs or overflow.
     * @internal
     */
    static convert_int_scale(value, from_scale, to_scale, round) {
        if (!Number.isSafeInteger(value)) {
            throw new Error(`Invalid value: expected safe integer, got ${value}`);
        }
        if (!Number.isSafeInteger(from_scale) || from_scale <= 0) {
            throw new Error(`Invalid from_scale: expected positive safe integer, got ${from_scale}`);
        }
        if (!Number.isSafeInteger(to_scale) || to_scale <= 0) {
            throw new Error(`Invalid to_scale: expected positive safe integer, got ${to_scale}`);
        }
        if (from_scale === to_scale)
            return value;
        // exact divisor path
        if (from_scale % to_scale === 0) {
            const divisor = Math.trunc(from_scale / to_scale);
            return SafeInt.div_int_checked(value, divisor, round);
        }
        // exact multiplier path
        if (to_scale % from_scale === 0) {
            const multiplier = Math.trunc(to_scale / from_scale);
            const product = value * multiplier;
            if (!Number.isSafeInteger(product)) {
                throw new Error(`Overflow in multiplication: ${value} * ${multiplier} = ${product}`);
            }
            return product;
        }
        // general ratio: (value * to_scale) / from_scale with chosen rounding
        const numerator = value * to_scale;
        if (!Number.isSafeInteger(numerator)) {
            throw new Error(`Overflow computing numerator in convert_int_scale(${value}, ${from_scale} -> ${to_scale})`);
        }
        return SafeInt.div_int_checked(numerator, from_scale, round);
    }
}
/* ============================================================================
   Namespace: shared types & constants for SafeInt
   ========================================================================== */
(function (SafeInt) {
    /**
     * Canonical integer scales (units-per-base).
     *
     * @example
     * Base = 1, Milli = 1e3, Micro = 1e6, Nano = 1e9, Pico = 1e12
     *
     * @docs
     */
    let Scale;
    (function (Scale) {
        /** Base units (whole units). */
        Scale[Scale["Base"] = 1] = "Base";
        /** Milli units (1e3 per base). */
        Scale[Scale["Milli"] = 1000] = "Milli";
        /** Micro units (1e6 per base). */
        Scale[Scale["Micro"] = 1000000] = "Micro";
        /** Nano units (1e9 per base). */
        Scale[Scale["Nano"] = 1000000000] = "Nano";
        /** Pico units (1e12 per base). */
        Scale[Scale["Pico"] = 1000000000000] = "Pico";
    })(Scale = SafeInt.Scale || (SafeInt.Scale = {}));
    /** Convert a string scale to the actual scale. */
    function str_to_scale(scale) {
        switch (scale) {
            case "base": return Scale.Base;
            case "milli": return Scale.Milli;
            case "micro": return Scale.Micro;
            case "nano": return Scale.Nano;
            case "pico": return Scale.Pico;
            default: throw new Error(`Unknown scale: ${scale}`);
        }
    }
    SafeInt.str_to_scale = str_to_scale;
})(SafeInt || (SafeInt = {}));
