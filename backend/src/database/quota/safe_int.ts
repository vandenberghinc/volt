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
 * - The stored value is always an **integer (`bigint`)** (may be negative) measured in units of `S`.
 * - Instances are **immutable**; all arithmetic returns new `SafeInt` instances.
 * - Conversions are **exact by default**. Provide a {@link SafeInt.Rounding} `round` to allow rounding.
 * - Arithmetic is **same-scale only**: pass raw integers or another `SafeInt<S>`.
 * 
 * @nav Database
 * @docs
 */
export class SafeInt<S extends SafeInt.Scale = SafeInt.Scale.Base> {

    // ----------------------------------------------------------------
    // Fields
    // ----------------------------------------------------------------

    /**
     * The stored integer (may be negative) measured at {@link int_scale}.
     */
    protected readonly int_value: bigint;

    /**
     * The canonical integer scale for {@link int_value}.
     */
    protected readonly int_scale: S;

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
    constructor(
        value: number | bigint | string,
        opts: S | SafeInt.ScaleToString<S> | { to_scale: S | SafeInt.ScaleToString<S>; from_scale?: SafeInt.Scale | SafeInt.StringScale; round?: SafeInt.Rounding },
    ) {

        // Already-at-scale (exact)
        if (typeof opts === "number" || typeof opts === "string") {
            const scale = typeof opts === "string"
                ? SafeInt.str_to_scale(opts)
                : opts;
            // validate scale (must be a positive safe integer)
            if (!Number.isSafeInteger(scale) || scale <= 0) {
                throw new Error(`Invalid scale: expected positive safe integer, got ${scale}`);
            }

            // value can be any integer (negative allowed); validate number inputs are safe integers
            if (typeof value === "string") {
                // already-at-scale string must be an integer string (no decimal point)
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

        let converted: bigint;
        if (from_scale === to_scale) {
            if (to_scale === SafeInt.Scale.Base) {
                // Base scale can accept:
                // - number input (may be float; exactness/rounding rules apply)
                // - bigint input (always an integer; rounding is a no-op)
                if (typeof value === "string") {
                    // base->base stores integer base units; string must be integer
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
                    // non-base, same-scale: must be integer
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
            // base -> integer scale
            // - number input may be float; exactness/rounding rules apply
            // - bigint input represents an integer base amount; conversion is exact bigint math (rounding is a no-op)
            if (typeof value === "string") {
                // Decimal-safe path: parse base string exactly, then scale in bigint space.
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
            // integer scale -> base integer, possibly rounded
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
            // integer-scale -> integer-scale
            if (typeof value === "number") {
                if (!Number.isSafeInteger(value)) {
                    throw new Error(`Invalid value: expected safe integer at scale=${from_scale}, got ${value}`);
                }
            }
            const v =
                typeof value === "string" ? SafeInt.parse_int_str(value, "value")
                : typeof value === "number" ? BigInt(value)
                : value;
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
    value(): bigint {
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
    to_number(): number {
        // Convert to number only when the stored integer can be represented safely as a JS number.
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
    valueOf(): bigint {
        return this.int_value;
    }

    /**
     * Retrieve this instance's canonical scale.
     *
     * @returns The positive integer scale for this value.
     * 
     * @docs
     */
    scale(): S {
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
    to_base_float(): number {
        if (this.int_scale === SafeInt.Scale.Base) return this.to_number();

        const denom = BigInt(this.int_scale);
        const q = this.int_value / denom;
        const r = this.int_value % denom;

        const max_safe = BigInt(Number.MAX_SAFE_INTEGER);
        if (q > max_safe || q < -max_safe) {
            throw new Error(`Cannot represent base float safely: quotient ${q.toString()} out of range`);
        }

        // r fits in denom; denom is a safe integer scale, so Number(denom) is safe
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
    to_scale<T extends SafeInt.Scale>(to_scale: T, round: SafeInt.Rounding = "exact"): SafeInt<T> {
        // validate target scale
        if (!Number.isSafeInteger(to_scale) || to_scale <= 0) {
            throw new Error(`Invalid to_scale: expected positive safe integer, got ${to_scale}`);
        }

        if (this.int_scale === to_scale as SafeInt.Scale) {
            // Preserve type at call-site
            return new SafeInt<T>(this.int_value, to_scale);
        }

        if (to_scale === SafeInt.Scale.Base) {
            const base_int = SafeInt.div_to_base(this.int_value, this.int_scale, round);
            return new SafeInt<T>(base_int, SafeInt.Scale.Base as T);
        }

        if (this.int_scale === SafeInt.Scale.Base) {
            // base-scale values are stored as integers; multiplying by `to_scale` stays integer-safe in bigint space
            const product = this.int_value * BigInt(to_scale);
            return new SafeInt<T>(product, to_scale);
        }

        const n = SafeInt.convert_int_scale(this.int_value, this.int_scale, to_scale, round);
        return new SafeInt<T>(n, to_scale);
    }

    /**
     * Rescale to base (1).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Base>`.
     * 
     * @docs
     */
    base(): SafeInt<SafeInt.Scale.Base> {
        return this.to_scale(SafeInt.Scale.Base);
    }

    /**
     * Rescale to milli (1e3).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Milli>`.
     * 
     * @docs
     */
    milli(): SafeInt<SafeInt.Scale.Milli> {
        return this.to_scale(SafeInt.Scale.Milli);
    }

    /**
     * Rescale to micro (1e6).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Micro>`.
     * 
     * @docs
     */
    micro(): SafeInt<SafeInt.Scale.Micro> {
        return this.to_scale(SafeInt.Scale.Micro);
    }

    /**
     * Rescale to nano (1e9).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Nano>`.
     * 
     * @docs
     */
    nano(): SafeInt<SafeInt.Scale.Nano> {
        return this.to_scale(SafeInt.Scale.Nano);
    }

    /**
     * Rescale to pico (1e12).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Pico>`.
     * 
     * @docs
     */
    pico(): SafeInt<SafeInt.Scale.Pico> {
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
    add(other: number | bigint | SafeInt<S>): SafeInt<S> {
        const b = typeof other === "number"
            ? (Number.isSafeInteger(other) ? BigInt(other) : (() => { throw new Error(`Invalid 'addend': expected a safe integer, got ${other}`); })())
            : (typeof other === "bigint" ? other : other.int_value);

        const sum = this.int_value + b;
        return new SafeInt<S>(sum, this.int_scale);
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
    sub(other: number | bigint | SafeInt<S>): SafeInt<S> {
        const b = typeof other === "number"
            ? (Number.isSafeInteger(other) ? BigInt(other) : (() => { throw new Error(`Invalid 'subtrahend': expected a safe integer, got ${other}`); })())
            : (typeof other === "bigint" ? other : other.int_value);

        const diff = this.int_value - b;
        return new SafeInt<S>(diff, this.int_scale);
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
    mul(factor: number | bigint | SafeInt<S>): SafeInt<S> {
        const f = typeof factor === "number"
            ? (Number.isSafeInteger(factor) ? BigInt(factor) : (() => { throw new Error(`Invalid 'factor': expected a safe integer, got ${factor}`); })())
            : (typeof factor === "bigint" ? factor : factor.int_value);

        const product = this.int_value * f;
        return new SafeInt<S>(product, this.int_scale);
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
    div(divisor: number | bigint | SafeInt<S>, round: SafeInt.Rounding = "exact"): SafeInt<S> {
        const d = typeof divisor === "number"
            ? (Number.isSafeInteger(divisor) ? BigInt(divisor) : (() => { throw new Error(`Invalid 'divisor': expected a non-zero safe integer, got ${divisor}`); })())
            : (typeof divisor === "bigint" ? divisor : divisor.int_value);

        if (d === 0n) {
            throw new Error(`Invalid 'divisor': expected a non-zero safe integer, got 0`);
        }

        const q = SafeInt.div_int_checked(this.int_value, d, round);
        return new SafeInt<S>(q, this.int_scale);
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
    cmp(other: SafeInt<S>): number {
        const rhs = other.int_value;
        if (this.int_value < rhs) return -1;
        if (this.int_value > rhs) return 1;
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
    eq(other: SafeInt<S>): boolean {
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
    assert_non_negative(): void {
        if (this.int_value < 0n) {
            throw new Error(`Invalid value: expected non-negative integer, got ${this.int_value.toString()}`);
        }
    }

    /**
     * Assert `value` is a `>0` integer.
     * 
     * @docs
     */
    assert_positive(): void {
        if (this.int_value <= 0n) {
            throw new Error(`Invalid value: expected positive integer, got ${this.int_value.toString()}`);
        }
    }

    /**
     * Assert `value` is a `<=0` integer.
     * 
     * @docs
     */
    assert_non_positive(): void {
        if (this.int_value > 0n) {
            throw new Error(`Invalid value: expected non-positive integer, got ${this.int_value.toString()}`);
        }
    }

    /**
     * Assert `value` is a `<0` integer.
     * 
     * @docs
     */
    assert_negative(): void {
        if (this.int_value >= 0n) {
            throw new Error(`Invalid value: expected negative integer, got ${this.int_value.toString()}`);
        }
    }

    /**
     * Assert `value` is a `>=0` safe integer.
     * 
     * @docs
     */
    static assert_non_negative(value: number, label: string): void {
        if (!Number.isSafeInteger(value) || value < 0) {
            throw new Error(`Invalid '${label}': expected non-negative safe integer, got ${value}`);
        }
    }

    /**
     * Assert `value` is a `>0` safe integer.
     * 
     * @docs
     */
    static assert_positive(value: number, label: string): void {
        if (!Number.isSafeInteger(value) || value <= 0) {
            throw new Error(`Invalid '${label}': expected positive safe integer, got ${value}`);
        }
    }

    /**
     * Assert `value` is a `<=0` safe integer.
     * 
     * @docs
     */
    static assert_non_positive(value: number, label: string): void {
        if (!Number.isSafeInteger(value) || value > 0) {
            throw new Error(`Invalid '${label}': expected non-positive safe integer, got ${value}`);
        }
    }

    /**
     * Assert `value` is a `<0` safe integer.
     * 
     * @docs
     */
    static assert_negative(value: number, label: string): void {
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
    protected static apply_round(v: number, round: SafeInt.Rounding): number {
        if (!Number.isFinite(v)) throw new Error(`Invalid value for rounding: ${v}`);
        if (round === "floor") return Math.floor(v);
        if (round === "ceil") return Math.ceil(v);
        if (round === "round") return Math.round(v);
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
    protected static parse_int_str(text: string, label: string): bigint {
        const s = text.trim().replace(/_/g, "");
        if (s.length === 0) throw new Error(`Invalid '${label}': empty string`);
        if (!/^[+-]?\d+$/.test(s)) {
            throw new Error(`Invalid '${label}': expected integer string, got '${text}'`);
        }
        // BigInt() accepts leading +/- and digits.
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
    protected static parse_base_decimal_to_scaled(
        text: string,
        to_scale: number,
        round: SafeInt.Rounding,
    ): bigint {
        const raw = text.trim().replace(/_/g, "");
        if (raw.length === 0) throw new Error(`Invalid 'value': empty string`);

        let sign = 1n;
        let s = raw;
        if (s[0] === "+") s = s.slice(1);
        else if (s[0] === "-") { sign = -1n; s = s.slice(1); }

        if (s.length === 0) throw new Error(`Invalid 'value': expected digits, got '${text}'`);

        const parts = s.split(".");
        if (parts.length > 2) throw new Error(`Invalid 'value': too many decimal points in '${text}'`);

        const int_part = parts[0] === "" ? "0" : parts[0];
        const frac_part = parts.length === 2 ? (parts[1] ?? "") : "";

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
        const numerator = (whole * denom + frac) * sign; // value = numerator / denom

        // scaled = (numerator * to_scale) / denom with rounding
        const scaled_num = numerator * BigInt(to_scale);
        return SafeInt.div_int_checked(scaled_num, denom, round);
    }

    /**
     * Compute 10^n as bigint.
     * @internal
     */
    protected static pow10(n: number): bigint {
        if (!Number.isSafeInteger(n) || n < 0) {
            throw new Error(`Invalid pow10 exponent: ${n}`);
        }
        // Guard against pathological inputs (optional; adjust as you like)
        if (n > 1_000) {
            throw new Error(`Invalid decimal precision: ${n} (too large)`);
        }
        // Fast enough for typical precision values; avoids floating-point.
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
    protected static div_to_base(value: bigint, from_scale: number, round: SafeInt.Rounding): bigint {
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
    protected static div_int_checked(
        numerator: bigint,
        denominator: bigint,
        round: SafeInt.Rounding = "exact",
    ): bigint {
        if (denominator <= 0n) throw new Error(`Invalid denominator: ${denominator.toString()}`);

        const q = numerator / denominator;   // trunc toward 0
        const rem = numerator % denominator; // same sign as numerator

        if (round === "exact") {
            if (rem !== 0n) throw new Error(`Non-exact division: ${numerator.toString()} / ${denominator.toString()} leaves remainder ${rem.toString()}`);
            return q;
        }

        if (rem === 0n) return q;

        if (round === "floor") {
            // if numerator is negative, trunc is "too high" (closer to 0) compared to floor
            return numerator < 0n ? q - 1n : q;
        }

        if (round === "ceil") {
            // if numerator is positive, trunc is "too low" compared to ceil
            return numerator > 0n ? q + 1n : q;
        }

        if (round === "round") {
            const absRem = rem < 0n ? -rem : rem;
            const twice = absRem * 2n;

            if (twice < denominator) return q;

            // ties + above: move away from zero
            return numerator >= 0n ? q + 1n : q - 1n;
        }

        throw new Error(`Invalid round: ${round as string}`);
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
    protected static convert_int_scale(
        value: bigint,
        from_scale: number,
        to_scale: number,
        round: SafeInt.Rounding,
    ): bigint {
        if (!Number.isSafeInteger(from_scale) || from_scale <= 0) {
            throw new Error(`Invalid from_scale: expected positive safe integer, got ${from_scale}`);
        }
        if (!Number.isSafeInteger(to_scale) || to_scale <= 0) {
            throw new Error(`Invalid to_scale: expected positive safe integer, got ${to_scale}`);
        }

        if (from_scale === to_scale) return value;

        // exact divisor path
        if (from_scale % to_scale === 0) {
            const divisor = BigInt(Math.trunc(from_scale / to_scale));
            return SafeInt.div_int_checked(value, divisor, round);
        }

        // exact multiplier path
        if (to_scale % from_scale === 0) {
            const multiplier = BigInt(Math.trunc(to_scale / from_scale));
            return value * multiplier;
        }

        // general ratio: (value * to_scale) / from_scale with chosen rounding
        const numerator = value * BigInt(to_scale);
        return SafeInt.div_int_checked(numerator, BigInt(from_scale), round);
    }
}

/* ============================================================================
   Namespace: shared types & constants for SafeInt
   ========================================================================== */

export namespace SafeInt {
    /**
     * Rounding mode for integer division and integer-scale conversions.
     *
     * - `"exact"` — require exactness; throw if any remainder exists (default).
     * - `"floor"` — round toward -∞ (mathematical floor).
     * - `"ceil"`  — round toward +∞ (mathematical ceil).
     * - `"round"` — round half away from zero (|x|≥0.5 rounds outward).
     * 
     * @docs
     */
    export type Rounding = "exact" | "floor" | "ceil" | "round";

    /**
     * Canonical integer scales (units-per-base).
     *
     * @example
     * Base = 1, Milli = 1e3, Micro = 1e6, Nano = 1e9, Pico = 1e12
     * 
     * @docs
     */
    export enum Scale {
        /** Base units (whole units). */
        Base = 1,
        /** Milli units (1e3 per base). */
        Milli = 1_000,
        /** Micro units (1e6 per base). */
        Micro = 1_000_000,
        /** Nano units (1e9 per base). */
        Nano = 1_000_000_000,
        /** Pico units (1e12 per base). */
        Pico = 1_000_000_000_000,
    }

    /** The string version of the scale. */
    export type StringScale =
        | "base"
        | "milli"
        | "micro"
        | "nano"
        | "pico";

    /** Scale type from scale string or scale enum. */
    export type ToScale<S extends StringScale | Scale> = S extends StringScale
        ? StringToScale<S>
        : Scale;

    /** Scale to string. */
    export type StringToScale<S extends StringScale> = S extends "base" ? Scale.Base
        : S extends "milli" ? Scale.Milli
        : S extends "micro" ? Scale.Micro
        : S extends "nano" ? Scale.Nano
        : S extends "pico" ? Scale.Pico
        : never;

    /** Scale to string. */
    export type ScaleToString<S extends Scale | StringScale> =
        S extends StringScale ? S
        : S extends Scale.Base ? "base"
        : S extends Scale.Milli ? "milli"
        : S extends Scale.Micro ? "micro"
        : S extends Scale.Nano ? "nano"
        : S extends Scale.Pico ? "pico"
        : never;

    /** Convert a string scale to the actual scale. */
    export function str_to_scale<S extends Scale>(scale: ScaleToString<S>): S {
        switch (scale) {
            case "base": return Scale.Base as S;
            case "milli": return Scale.Milli as S;
            case "micro": return Scale.Micro as S;
            case "nano": return Scale.Nano as S;
            case "pico": return Scale.Pico as S;
            default: throw new Error(`Unknown scale: ${scale}`);
        }
    }

    /**
     * Alias for `SafeInt<Scale.Base>`
     * @docs
     */
    export type Base = SafeInt<Scale.Base>;

    /**
     * Alias for `SafeInt<Scale.Milli>`
     * @docs
     */
    export type Milli = SafeInt<Scale.Milli>;

    /**
     * Alias for `SafeInt<Scale.Micro>`
     * @docs
     */
    export type Micro = SafeInt<Scale.Micro>;

    /**
     * Alias for `SafeInt<Scale.Nano>`
     * @docs
     */
    export type Nano = SafeInt<Scale.Nano>;

    /**
     * Alias for `SafeInt<Scale.Pico>`
     * @docs
     */
    export type Pico = SafeInt<Scale.Pico>;
}
