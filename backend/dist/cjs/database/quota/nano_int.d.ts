/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * A tiny, safe, integer-only amount class that stores values at nano scale (1e9)
 * and provides safe arithmetic + conversions to/from other scales.
 */
export declare class NanoInt {
    /**
     * The internal nano-scale value.
     * Always a non-negative, safe integer at {@link NanoInt.Scale.Nano}.
     */
    private readonly nano_val;
    /**
     * Construct from a nano-scale value.
     *
     * @param nano_val A non-negative safe integer at nano scale.
     * @throws Error If {@link nano_val} is not a non-negative safe integer.
     */
    constructor(nano_val: number);
    /**
     * Construct from a value expressed at another scale.
     *
     * @param val         The input value at {@link from_scale}.
     * @param from_scale  The input scale (e.g., {@link NanoInt.Scale.Base} or {@link NanoInt.Scale.Nano}).
     * @throws Error If inputs are invalid or conversion overflows.
     */
    constructor(val: number, from_scale: number);
    /**
     * Retrieve the underlying nano-scale value as a number.
     *
     * @returns The stored non-negative safe integer at nano scale.
     */
    value(): number;
    /**
     * Alias of {@link value}. Provided for JavaScript numeric coercion.
     *
     * @returns The stored non-negative safe integer at nano scale.
     */
    valueOf(): number;
    /**
     * Alias of {@link value}. Semantic name for clarity.
     *
     * @returns The stored non-negative safe integer at nano scale.
     */
    nano(): number;
    /**
     * Convert to base scale (1) as a floating-point number.
     *
     * @returns The amount in base scale (presentation float).
     */
    to_base(): number;
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
    to_scale(to_scale: number, mode?: NanoInt.RoundingMode): number;
    /**
     * Add a nano-scale integer or another {@link NanoInt}, returning a new instance.
     *
     * @param other The addend: a non-negative safe integer (nano) or another {@link NanoInt}.
     * @returns     A new {@link NanoInt} with the summed nano value.
     * @throws      Error if inputs are invalid or overflow occurs.
     */
    add(other: number | NanoInt): NanoInt;
    /**
     * Subtract a nano-scale integer or another {@link NanoInt}, returning a new instance.
     *
     * @param other The subtrahend: a non-negative safe integer (nano) or another {@link NanoInt}.
     * @returns     A new {@link NanoInt} with the difference.
     * @throws      Error if inputs are invalid, overflow occurs, or the result would be negative.
     */
    sub(other: number | NanoInt): NanoInt;
    /**
     * Multiply by a non-negative safe integer factor, returning a new instance.
     *
     * @param factor A non-negative safe integer multiplier.
     * @returns      A new {@link NanoInt} with the product.
     * @throws       Error if inputs are invalid or overflow occurs.
     */
    mul(factor: number | NanoInt): NanoInt;
    /**
     * Divide by a positive safe integer divisor with explicit rounding, returning a new instance.
     *
     * @param divisor A positive safe integer divisor.
     * @param mode    Rounding mode (default: "exact").
     * @returns       A new {@link NanoInt} with the quotient (still nano scale).
     * @throws        Error on invalid inputs, division by zero, non-exact remainder in "exact" mode, or overflow.
     */
    div(divisor: number | NanoInt, mode?: NanoInt.RoundingMode): NanoInt;
    /**
     * Assert a value is a non-negative safe integer at nano scale.
     *
     * @param label  Label for diagnostics.
     * @param value  The value to assert.
     * @param prefix Optional message prefix.
     * @throws       Error if the assertion fails.
     */
    static assert_nano_int(label: string, value: number, prefix?: string): asserts value is NanoInt.NanoIntValue;
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
    static to_scale(value: number, from_scale: number, to_scale: number): number;
    /**
     * Assert a generic non-negative safe integer (used for operands).
     *
     * @param label Label for diagnostics.
     * @param v     The value to validate.
     * @throws      Error if invalid.
     */
    static assert_non_negative_safe_int(label: string, v: number): void;
    /**
     * Safely add two safe integers with overflow checking.
     *
     * @param a     First operand (safe integer).
     * @param b     Second operand (safe integer; may be negative).
     * @param label Label used in error messages.
     * @returns     The safe-integer sum.
     * @throws      Error if inputs are invalid or overflow occurs.
     */
    static safe_add_int(a: number, b: number, label: string): number;
    /**
     * Safely multiply two non-negative safe integers.
     *
     * @param a Non-negative safe integer multiplicand.
     * @param b Non-negative safe integer multiplier.
     * @returns The safe-integer product.
     * @throws  Error if inputs are invalid or overflow occurs.
     */
    static safe_mul_int(a: number, b: number): number;
    /**
     * Safely divide two non-negative safe integers with explicit rounding.
     *
     * @param numerator   Non-negative safe-integer numerator.
     * @param denominator Positive safe-integer denominator.
     * @param mode        Rounding mode (default: "exact").
     * @returns           Safe-integer quotient according to {@link mode}.
     * @throws            Error on invalid inputs, division by zero, non-exact remainder in "exact" mode, or overflow.
     */
    static safe_div_int(numerator: number, denominator: number, mode?: NanoInt.RoundingMode): number;
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
    private static convert_int_scale;
}
/** Nested types of the {@link NanoInt} class. */
export declare namespace NanoInt {
    /**
     * The rounding mode used by integer division helpers.
     */
    type RoundingMode = "exact" | "floor" | "ceil" | "round";
    /**
     * Standard amount scales.
     * - Base = 1 (whole units; e.g. 1.23 EUR)
     * - Nano = 1_000_000_000 (nano-units; e.g. 1.23 EUR → 1_230_000_000)
     */
    enum Scale {
        Base = 1,
        Nano = 1000000000
    }
    /**
     * Strongly-typed alias for a non-negative, safe integer representing nano-units.
     */
    type NanoIntValue = number;
}
