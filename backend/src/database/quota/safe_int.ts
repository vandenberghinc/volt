/**
 * @author Daan …
 * @copyright …
 */

/* ============================================================================
   SafeInt — a single, generic, integer-only amount class
   ----------------------------------------------------------------------------
   - **No derived classes.** A single generic class parameterized by its scale `S`.
   - **Exact-by-default.** No silent rounding anywhere; rounding only when `mode` is provided.
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
 * - The stored value is always a **non-negative, safe JavaScript integer** measured in units of `S`.
 * - Instances are **immutable**; all arithmetic returns new `SafeInt` instances.
 * - Conversions are **exact by default**. Provide a {@link SafeInt.RoundingNode} `mode` to allow rounding.
 * - Arithmetic is **same-scale only**: pass raw integers or another `SafeInt<S>`.
 */
export class SafeInt<S extends SafeInt.Scale = SafeInt.Scale.Base> {

    // ----------------------------------------------------------------
    // Fields
    // ----------------------------------------------------------------

    /**
     * The stored non-negative safe integer measured at {@link int_scale}.
     */
    protected readonly int_value: number;

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
     *              - If `from_scale === Base`, `value` may be a float. When `mode` is omitted,
     *                `value * to_scale` must be an integer. If `mode` is provided, that rounding is applied.
     *              - If `from_scale !== Base`, `value` must be a non-negative safe integer.
     * @param opts  The canonical scale or scale options.
     * @param opts.to_scale   The target scale for storage (the resulting instance type is `SafeInt<opts.to_scale>`).
     * @param opts.from_scale The source scale of {@link value}, defaults to {@link SafeInt.Scale.Base}.
     * @param opts.mode       Optional rounding mode for non-exact conversions (default: `"exact"`).
     *
     * @example
     * new SafeInt(123_000, SafeInt.Scale.Nano)
     * @example
     * new SafeInt(123_000, "nano")
     * @example
     * new SafeInt(1.5, { from_scale: SafeInt.Scale.Base, to_scale: SafeInt.Scale.Milli, mode: "round" }) // 1500
     *
     * @throws
     * Error If inputs are invalid, conversion overflows, or exactness is required but not met.
     */
    constructor(
        value: number,
        opts: S | SafeInt.ScaleToString<S> | { to_scale: S | SafeInt.ScaleToString<S>; from_scale?: SafeInt.Scale | SafeInt.StringScale; mode?: SafeInt.RoundingNode },
    ) {
        
        // Already-at-scale (exact)
        if (typeof opts === "number" || typeof opts === "string") {
            const scale = typeof opts === "string"
                ? SafeInt.str_to_scale(opts)
                : opts;
            SafeInt.assert_positive_safe_int("scale", scale);
            // base must be integer too (no floats stored)
            if (scale === SafeInt.Scale.Base) {
                SafeInt.assert_non_negative_safe_int("value (base)", value);
            } else {
                SafeInt.assert_non_negative_safe_int(`value (scale=${scale})`, value);
            }
            this.int_value = value;
            this.int_scale = scale;
            return;
        }

        // Convert from -> to (exact by default; optional rounding)
        let { to_scale, from_scale = SafeInt.Scale.Base, mode = "exact" } = opts;
        if (typeof to_scale === "string") {
            to_scale = SafeInt.str_to_scale(to_scale);
        }
        if (typeof from_scale === "string") {
            from_scale = SafeInt.str_to_scale(from_scale);
        }
        SafeInt.assert_positive_safe_int("from_scale", from_scale);
        SafeInt.assert_positive_safe_int("to_scale", to_scale);

        let converted: number;

        if (from_scale === to_scale) {
            if (to_scale === SafeInt.Scale.Base) {
                if (mode === "exact") {
                    SafeInt.assert_non_negative_safe_int("value (base exact)", Math.trunc(value));
                    if (!Number.isInteger(value)) {
                        throw new Error(`Exact constructor requires integer at base scale, got ${value}`);
                    }
                    converted = value;
                } else {
                    const rounded = SafeInt.apply_round(value, mode);
                    SafeInt.assert_non_negative_safe_int("rounded base value", rounded);
                    converted = rounded;
                }
            } else {
                SafeInt.assert_non_negative_safe_int(`value (scale=${to_scale})`, value);
                converted = value;
            }
        } else if (from_scale === SafeInt.Scale.Base) {
            // base -> integer scale
            const product = value * to_scale;
            if (mode === "exact") {
                if (!Number.isFinite(product) || !Number.isInteger(product) || product < 0) {
                    throw new Error(`Exact conversion failed: ${value} * ${to_scale} is not an integer`);
                }
                if (!Number.isSafeInteger(product)) {
                    throw new Error(`Overflow converting base->${to_scale}: ${product}`);
                }
                converted = product;
            } else {
                const rounded = SafeInt.apply_round(product, mode);
                if (!Number.isSafeInteger(rounded) || rounded < 0) {
                    throw new Error(`Overflow/invalid rounding converting base->${to_scale}: ${product} -> ${rounded}`);
                }
                converted = rounded;
            }
        } else if (to_scale === SafeInt.Scale.Base) {
            // integer scale -> base integer, possibly rounded
            SafeInt.assert_non_negative_safe_int(`value (scale=${from_scale})`, value);
            converted = SafeInt.div_to_base(value, from_scale, mode);
        } else {
            // integer-scale -> integer-scale
            SafeInt.assert_non_negative_safe_int(`value (scale=${from_scale})`, value);
            converted = SafeInt.convert_int_scale(value, from_scale, to_scale, mode);
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
     * @returns The stored non-negative safe integer.
     */
    value(): number {
        return this.int_value;
    }

    /**
     * Alias of {@link value}. Provided for JavaScript numeric coercion.
     *
     * @returns The stored non-negative safe integer.
     */
    valueOf(): number {
        return this.int_value;
    }

    /**
     * Retrieve this instance's canonical scale.
     *
     * @returns The positive integer scale for this value.
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
     */
    to_base(): number {
        if (this.int_scale === SafeInt.Scale.Base) return this.int_value;
        SafeInt.assert_non_negative_safe_int("int_value", this.int_value);
        return this.int_value / this.int_scale;
    }

    // ----------------------------------------------------------------
    // scale conversion — strongly typed
    // ----------------------------------------------------------------

    /**
     * Convert this instance to another integer scale.
     * **Exact by default** — provide a {@link SafeInt.RoundingNode} to allow rounding.
     *
     * @typeParam T - Target scale (see {@link SafeInt.Scale}).
     * @param to_scale The target canonical scale.
     * @param mode     Rounding mode for non-exact ratios (default `"exact"`).
     *
     * @returns A new {@link SafeInt} typed as `SafeInt<T>`, storing an integer at `to_scale`.
     */
    to_scale<T extends SafeInt.Scale>(to_scale: T, mode: SafeInt.RoundingNode = "exact"): SafeInt<T> {
        SafeInt.assert_positive_safe_int("to_scale", to_scale);

        if (this.int_scale as SafeInt.Scale === to_scale) {
            // Preserve type at call-site
            return new SafeInt<T>(this.int_value, to_scale);
        }

        if (to_scale === SafeInt.Scale.Base) {
            const base_int = SafeInt.div_to_base(this.int_value, this.int_scale, mode);
            return new SafeInt<T>(base_int, SafeInt.Scale.Base as T);
        }

        if (this.int_scale === SafeInt.Scale.Base) {
            const product = this.int_value * to_scale;
            if (!Number.isSafeInteger(product) || product < 0) {
                throw new Error(`Overflow converting base->${to_scale}`);
            }
            return new SafeInt<T>(product, to_scale);
        }

        const n = SafeInt.convert_int_scale(this.int_value, this.int_scale, to_scale, mode);
        return new SafeInt<T>(n, to_scale);
    }

    /**
     * Rescale to base (1).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Base>`.
     */
    base(): SafeInt<SafeInt.Scale.Base> {
        return this.to_scale(SafeInt.Scale.Base);
    }

    /**
     * Rescale to milli (1e3).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Milli>`.
     */
    milli(): SafeInt<SafeInt.Scale.Milli> {
        return this.to_scale(SafeInt.Scale.Milli);
    }

    /**
     * Rescale to micro (1e6).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Micro>`.
     */
    micro(): SafeInt<SafeInt.Scale.Micro> {
        return this.to_scale(SafeInt.Scale.Micro);
    }

    /**
     * Rescale to nano (1e9).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Nano>`.
     */
    nano(): SafeInt<SafeInt.Scale.Nano> {
        return this.to_scale(SafeInt.Scale.Nano);
    }

    /**
     * Rescale to pico (1e12).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Pico>`.
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
     * @param other The addend, as a raw non-negative safe integer or a `SafeInt<S>`.
     * @returns     A new `SafeInt<S>` with the sum.
     *
     * @throws Error If the operand is invalid or the sum overflows.
     */
    add(other: number | SafeInt<S>): SafeInt<S> {
        const b = typeof other === "number" ? other : other.int_value;
        SafeInt.assert_non_negative_safe_int("addend", b);
        const sum = this.int_value + b;
        if (!Number.isSafeInteger(sum)) {
            throw new Error(`Overflow in add(): ${this.int_value} + ${b} = ${sum}`);
        }
        return new SafeInt<S>(sum, this.int_scale);
    }

    /**
     * Subtract an amount at the same scale.
     *
     * @param other The subtrahend, as a raw non-negative safe integer or a `SafeInt<S>`.
     * @returns     A new `SafeInt<S>` with the difference.
     *
     * @throws Error If the operand is invalid, subtraction overflows, or the result would be negative.
     */
    sub(other: number | SafeInt<S>): SafeInt<S> {
        const b = typeof other === "number" ? other : other.int_value;
        SafeInt.assert_non_negative_safe_int("subtrahend", b);
        const diff = this.int_value - b;
        if (!Number.isSafeInteger(diff)) {
            throw new Error(`Overflow in sub(): ${this.int_value} - ${b} = ${diff}`);
        }
        if (diff < 0) {
            throw new Error(`Underflow in sub(): ${this.int_value} - ${b} < 0`);
        }
        return new SafeInt<S>(diff, this.int_scale);
    }

    /**
     * Multiply by a non-negative integer factor at the same scale.
     *
     * @param factor The factor as a raw non-negative safe integer or a `SafeInt<S>`.
     * @returns      A new `SafeInt<S>` with the product.
     *
     * @throws Error If the factor is invalid or the product overflows.
     */
    mul(factor: number | SafeInt<S>): SafeInt<S> {
        const f = typeof factor === "number" ? factor : factor.int_value;
        SafeInt.assert_non_negative_safe_int("factor", f);
        const product = this.int_value * f;
        if (!Number.isSafeInteger(product)) {
            throw new Error(`Overflow in mul(): ${this.int_value} * ${f} = ${product}`);
        }
        return new SafeInt<S>(product, this.int_scale);
    }

    /**
     * Divide by a positive integer divisor at the same scale.
     *
     * @param divisor Positive safe integer or `SafeInt<S>` divisor.
     * @param mode    Rounding mode. Default `"exact"` requires no remainder.
     * @returns       A new `SafeInt<S>` with the integer quotient (per {@link mode}).
     *
     * @throws Error If the divisor is invalid, division by zero, non-exact remainder in `"exact"` mode, or overflow.
     */
    div(divisor: number | SafeInt<S>, mode: SafeInt.RoundingNode = "exact"): SafeInt<S> {
        const d = typeof divisor === "number" ? divisor : divisor.int_value;
        if (!Number.isSafeInteger(d) || d <= 0) {
            throw new Error(`Invalid 'divisor': expected positive safe integer, got ${d}`);
        }
        const q = SafeInt.div_int_checked(this.int_value, d, mode);
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
     */
    eq(other: SafeInt<S>): boolean {
        return this.cmp(other) === 0;
    }

    // ----------------------------------------------------------------
    // static helpers (internal)
    // ----------------------------------------------------------------

    /**
     * Apply a rounding mode to a floating value.
     *
     * @param v    Floating value to round.
     * @param mode Rounding mode.
     * @returns    Rounded integer (validated by the caller).
     * @internal
     */
    protected static apply_round(v: number, mode: SafeInt.RoundingNode): number {
        if (!Number.isFinite(v)) throw new Error(`Invalid value for rounding: ${v}`);
        if (mode === "floor") return Math.floor(v);
        if (mode === "ceil") return Math.ceil(v);
        if (mode === "round") return Math.round(v);
        throw new Error(`apply_round() called with mode='exact' which forbids rounding`);
    }

    /**
     * Convert integer-scale value → base **integer** using a rounding policy.
     *
     * @param value      Non-negative safe integer at `from_scale`.
     * @param from_scale Source scale.
     * @param mode       Rounding (default exact).
     * @returns          Base-scale integer.
     * @internal
     */
    protected static div_to_base(value: number, from_scale: number, mode: SafeInt.RoundingNode): number {
        if (mode === "exact") {
            if (value % from_scale !== 0) {
                throw new Error(`Exact conversion to base failed: ${value} % ${from_scale} !== 0`);
            }
            return value / from_scale;
        }
        return SafeInt.div_int_checked(value, from_scale, mode);
    }

    /**
     * Assert `v` is a non-negative safe integer.
     * @internal
     */
    protected static assert_non_negative_safe_int(label: string, v: number): void {
        if (!Number.isSafeInteger(v) || v < 0) {
            throw new Error(`Invalid ${label}: expected non-negative safe integer, got ${v}`);
        }
    }

    /**
     * Assert `v` is a positive safe integer (> 0).
     * @internal
     */
    protected static assert_positive_safe_int(label: string, v: number): void {
        if (!Number.isSafeInteger(v) || v <= 0) {
            throw new Error(`Invalid ${label}: expected positive safe integer, got ${v}`);
        }
    }

    /**
     * Integer division helper with selectable rounding semantics.
     *
     * @param numerator   Non-negative safe integer.
     * @param denominator Positive safe integer.
     * @param mode        Rounding mode (default `"exact"`).
     * @returns           Integer quotient as per {@link mode}.
     *
     * @throws Error On invalid inputs, division by zero, non-exact remainder in `"exact"`, or overflow.
     * @internal
     */
    protected static div_int_checked(
        numerator: number,
        denominator: number,
        mode: SafeInt.RoundingNode = "exact",
    ): number {
        if (!Number.isSafeInteger(numerator) || numerator < 0) throw new Error(`Invalid numerator: ${numerator}`);
        if (!Number.isSafeInteger(denominator) || denominator <= 0) throw new Error(`Invalid denominator: ${denominator}`);
        const q = Math.trunc(numerator / denominator);
        const prod = q * denominator;
        if (!Number.isSafeInteger(prod)) throw new Error(`Overflow computing remainder`);
        const rem = numerator - prod;
        if (mode === "exact") {
            if (rem !== 0) throw new Error(`Non-exact division: ${numerator} / ${denominator} leaves remainder ${rem}`);
            return q;
        }
        if (mode === "floor") return q;
        if (mode === "ceil") return rem === 0 ? q : (q + 1);
        if (mode === "round") {
            const twice = rem * 2;
            if (!Number.isSafeInteger(twice)) throw new Error(`Overflow computing rounding threshold`);
            return twice >= denominator ? (q + 1) : q;
        }
        throw new Error(`Invalid mode: ${mode as string}`);
    }

    /**
     * Integer-only scale converter with rounding policy.
     *
     * @param value       Non-negative safe integer at {@link from_scale}.
     * @param from_scale  Integer source scale.
     * @param to_scale    Integer target scale.
     * @param mode        Rounding mode (default exact).
     * @returns           Non-negative safe integer at `to_scale`.
     *
     * @throws Error On invalid inputs or overflow.
     * @internal
     */
    protected static convert_int_scale(
        value: number,
        from_scale: number,
        to_scale: number,
        mode: SafeInt.RoundingNode,
    ): number {
        SafeInt.assert_non_negative_safe_int("value", value);
        SafeInt.assert_positive_safe_int("from_scale", from_scale);
        SafeInt.assert_positive_safe_int("to_scale", to_scale);

        if (from_scale === to_scale) return value;

        // exact divisor path
        if (from_scale % to_scale === 0) {
            const divisor = Math.trunc(from_scale / to_scale);
            return SafeInt.div_int_checked(value, divisor, mode);
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
        return SafeInt.div_int_checked(numerator, from_scale, mode);
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
     * - `"floor"` — truncate toward zero.
     * - `"ceil"`  — round up if any remainder exists.
     * - `"round"` — round half up (≥ 0.5).
     */
    export type RoundingNode = "exact" | "floor" | "ceil" | "round";

    /**
     * Canonical integer scales (units-per-base).
     *
     * @example
     * Base = 1, Milli = 1e3, Micro = 1e6, Nano = 1e9, Pico = 1e12
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

    /** Alias for `SafeInt<Scale.Base>` */
    export type Base = SafeInt<Scale.Base>;

    /** Alias for `SafeInt<Scale.Milli>` */
    export type Milli = SafeInt<Scale.Milli>;

    /** Alias for `SafeInt<Scale.Micro>` */
    export type Micro = SafeInt<Scale.Micro>;

    /** Alias for `SafeInt<Scale.Nano>` */
    export type Nano = SafeInt<Scale.Nano>;

    /** Alias for `SafeInt<Scale.Pico>` */
    export type Pico = SafeInt<Scale.Pico>;
}
