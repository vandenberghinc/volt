/**
 * @author Daan …
 * @copyright …
 */
/**
 * Scaled, integer-only amount with explicit, type-safe scale semantics.
 *
 * @template S The canonical integer scale (see {@link SafeInt.Scale}) at which this instance stores its value.
 *
 * @remarks
 * - The stored value is always a **safe JavaScript integer** (may be negative) measured in units of `S`.
 * - Instances are **immutable**; all arithmetic returns new `SafeInt` instances.
 * - Conversions are **exact by default**. Provide a {@link SafeInt.RoundingNode} `mode` to allow rounding.
 * - Arithmetic is **same-scale only**: pass raw integers or another `SafeInt<S>`.
 */
export declare class SafeInt<S extends SafeInt.Scale = SafeInt.Scale.Base> {
    /**
     * The stored safe integer (may be negative) measured at {@link int_scale}.
     */
    protected readonly int_value: number;
    /**
     * The canonical integer scale for {@link int_value}.
     */
    protected readonly int_scale: S;
    /**
     * Construct by converting from `opts.from_scale` to `opts.to_scale`. **Exact by default**.
     *
     * @param value The numeric input at `opts.from_scale`.
     *              - If `from_scale === Base`, `value` may be a float. When `mode` is omitted,
     *                `value * to_scale` must be an integer. If `mode` is provided, that rounding is applied.
     *              - If `from_scale !== Base`, `value` must be a safe integer.
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
    constructor(value: number, opts: S | SafeInt.ScaleToString<S> | {
        to_scale: S | SafeInt.ScaleToString<S>;
        from_scale?: SafeInt.Scale | SafeInt.StringScale;
        mode?: SafeInt.RoundingNode;
    });
    /**
     * Retrieve the underlying integer (measured in {@link scale} units).
     *
     * @returns The stored safe integer.
     */
    value(): number;
    /**
     * Alias of {@link value}. Provided for JavaScript numeric coercion.
     *
     * @returns The stored safe integer.
     */
    valueOf(): number;
    /**
     * Retrieve this instance's canonical scale.
     *
     * @returns The positive integer scale for this value.
     */
    scale(): S;
    /**
     * Convert to base scale (1) as a floating-point number (presentation).
     *
     * @returns The amount in base units as a float.
     */
    to_base_float(): number;
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
    to_scale<T extends SafeInt.Scale>(to_scale: T, mode?: SafeInt.RoundingNode): SafeInt<T>;
    /**
     * Rescale to base (1).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Base>`.
     */
    base(): SafeInt<SafeInt.Scale.Base>;
    /**
     * Rescale to milli (1e3).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Milli>`.
     */
    milli(): SafeInt<SafeInt.Scale.Milli>;
    /**
     * Rescale to micro (1e6).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Micro>`.
     */
    micro(): SafeInt<SafeInt.Scale.Micro>;
    /**
     * Rescale to nano (1e9).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Nano>`.
     */
    nano(): SafeInt<SafeInt.Scale.Nano>;
    /**
     * Rescale to pico (1e12).
     *
     * @returns A new `SafeInt<SafeInt.Scale.Pico>`.
     */
    pico(): SafeInt<SafeInt.Scale.Pico>;
    /**
     * Add an amount at the same scale.
     *
     * @param other The addend, as a raw safe integer or a `SafeInt<S>`.
     * @returns     A new `SafeInt<S>` with the sum.
     *
     * @throws Error If the operand is invalid or the sum overflows.
     */
    add(other: number | SafeInt<S>): SafeInt<S>;
    /**
     * Subtract an amount at the same scale.
     *
     * @param other The subtrahend, as a raw safe integer or a `SafeInt<S>`.
     * @returns     A new `SafeInt<S>` with the difference.
     *
     * @throws Error If the operand is invalid or subtraction overflows.
     */
    sub(other: number | SafeInt<S>): SafeInt<S>;
    /**
     * Multiply by an integer factor at the same scale.
     *
     * @param factor The factor as a raw safe integer or a `SafeInt<S>`.
     * @returns      A new `SafeInt<S>` with the product.
     *
     * @throws Error If the factor is invalid or the product overflows.
     */
    mul(factor: number | SafeInt<S>): SafeInt<S>;
    /**
     * Divide by a positive integer divisor at the same scale.
     *
     * @param divisor Positive safe integer or `SafeInt<S>` divisor.
     * @param mode    Rounding mode. Default `"exact"` requires no remainder.
     * @returns       A new `SafeInt<S>` with the integer quotient (per {@link mode}).
     *
     * @throws Error If the divisor is invalid, division by zero, non-exact remainder in `"exact"` mode, or overflow.
     */
    div(divisor: number | SafeInt<S>, mode?: SafeInt.RoundingNode): SafeInt<S>;
    /**
     * Compare with another `SafeInt<S>`.
     *
     * @param other The other amount (same scale).
     * @returns     `-1` if this < other, `0` if equal, `1` if this > other.
     */
    cmp(other: SafeInt<S>): number;
    /**
     * Test equality with another `SafeInt<S>`.
     *
     * @param other The other amount (same scale).
     * @returns     `true` if equal, otherwise `false`.
     */
    eq(other: SafeInt<S>): boolean;
    /**
     * Assert `value` is a `>=0` safe integer.
     */
    assert_non_negative(): void;
    /**
     * Assert `value` is a `>0` safe integer.
     */
    assert_positive(): void;
    /**
     * Assert `value` is a `<=0` safe integer.
     */
    assert_non_positive(): void;
    /**
     * Assert `value` is a `<0` safe integer.
     */
    assert_negative(): void;
    /**
     * Assert `value` is a `>=0` safe integer.
     */
    static assert_non_negative(value: number, label: string): void;
    /**
     * Assert `value` is a `>0` safe integer.
     */
    static assert_positive(value: number, label: string): void;
    /**
     * Assert `value` is a `<=0` safe integer.
     */
    static assert_non_positive(value: number, label: string): void;
    /**
     * Assert `value` is a `<0` safe integer.
     */
    static assert_negative(value: number, label: string): void;
    /**
     * Apply a rounding mode to a floating value.
     *
     * @param v    Floating value to round.
     * @param mode Rounding mode.
     * @returns    Rounded integer (validated by the caller).
     * @internal
     */
    protected static apply_round(v: number, mode: SafeInt.RoundingNode): number;
    /**
     * Convert integer-scale value → base **integer** using a rounding policy.
     *
     * @param value      Safe integer at `from_scale` (may be negative).
     * @param from_scale Source scale.
     * @param mode       Rounding (default exact).
     * @returns          Base-scale integer.
     * @internal
     */
    protected static div_to_base(value: number, from_scale: number, mode: SafeInt.RoundingNode): number;
    /**
     * Integer division helper with selectable rounding semantics.
     *
     * @param numerator   Safe integer (may be negative).
     * @param denominator Positive safe integer.
     * @param mode        Rounding mode (default `"exact"`).
     * @returns           Integer quotient as per {@link mode}.
     *
     * @throws Error On invalid inputs, division by zero, non-exact remainder in `"exact"`, or overflow.
     * @internal
     */
    protected static div_int_checked(numerator: number, denominator: number, mode?: SafeInt.RoundingNode): number;
    /**
     * Integer-only scale converter with rounding policy.
     *
     * @param value       Safe integer at {@link from_scale} (may be negative).
     * @param from_scale  Integer source scale.
     * @param to_scale    Integer target scale.
     * @param mode        Rounding mode (default exact).
     * @returns           Safe integer at `to_scale`.
     *
     * @throws Error On invalid inputs or overflow.
     * @internal
     */
    protected static convert_int_scale(value: number, from_scale: number, to_scale: number, mode: SafeInt.RoundingNode): number;
}
export declare namespace SafeInt {
    /**
     * Rounding mode for integer division and integer-scale conversions.
     *
     * - `"exact"` — require exactness; throw if any remainder exists (default).
     * - `"floor"` — truncate toward zero.
     * - `"ceil"`  — round up if any remainder exists.
     * - `"round"` — round half up (≥ 0.5).
     */
    type RoundingNode = "exact" | "floor" | "ceil" | "round";
    /**
     * Canonical integer scales (units-per-base).
     *
     * @example
     * Base = 1, Milli = 1e3, Micro = 1e6, Nano = 1e9, Pico = 1e12
     */
    enum Scale {
        /** Base units (whole units). */
        Base = 1,
        /** Milli units (1e3 per base). */
        Milli = 1000,
        /** Micro units (1e6 per base). */
        Micro = 1000000,
        /** Nano units (1e9 per base). */
        Nano = 1000000000,
        /** Pico units (1e12 per base). */
        Pico = 1000000000000
    }
    /** The string version of the scale. */
    type StringScale = "base" | "milli" | "micro" | "nano" | "pico";
    /** Scale type from scale string or scale enum. */
    type ToScale<S extends StringScale | Scale> = S extends StringScale ? StringToScale<S> : Scale;
    /** Scale to string. */
    type StringToScale<S extends StringScale> = S extends "base" ? Scale.Base : S extends "milli" ? Scale.Milli : S extends "micro" ? Scale.Micro : S extends "nano" ? Scale.Nano : S extends "pico" ? Scale.Pico : never;
    /** Scale to string. */
    type ScaleToString<S extends Scale | StringScale> = S extends StringScale ? S : S extends Scale.Base ? "base" : S extends Scale.Milli ? "milli" : S extends Scale.Micro ? "micro" : S extends Scale.Nano ? "nano" : S extends Scale.Pico ? "pico" : never;
    /** Convert a string scale to the actual scale. */
    function str_to_scale<S extends Scale>(scale: ScaleToString<S>): S;
    /** Alias for `SafeInt<Scale.Base>` */
    type Base = SafeInt<Scale.Base>;
    /** Alias for `SafeInt<Scale.Milli>` */
    type Milli = SafeInt<Scale.Milli>;
    /** Alias for `SafeInt<Scale.Micro>` */
    type Micro = SafeInt<Scale.Micro>;
    /** Alias for `SafeInt<Scale.Nano>` */
    type Nano = SafeInt<Scale.Nano>;
    /** Alias for `SafeInt<Scale.Pico>` */
    type Pico = SafeInt<Scale.Pico>;
}
