/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved.
 */
/** Null / undefined alias. */
export type None = undefined | null;
/**
 * Return type helper for common VElement methods.
 * Resolving the return type to `This` if `V` is `undefined,
 * or to `R` if no value is passed and `V` is undefined.
 */
export type ValueOrThis<V, R, This> = V extends undefined ? R : This;
/** Options for configuring a border through {@link VElement.border}. */
export interface BorderOpts {
    /** Default color. */
    color?: string;
    /**
     *  Border width.
     * @default 1px
     */
    width?: string | number;
    /**
     * Border style.
     * @default "solid"
     */
    style?: string;
    /**
     * Border radius.
     * @default 0
     */
    radius?: string | number;
    /**
     * Top border enabled or a specific color for this border.
     * @default true
     */
    top?: boolean | string;
    /**
     * Bottom border enabled or a specific color for this border.
     * @default true
     */
    bottom?: boolean | string;
    /**
     * Left border enabled or a specific color for this border.
     * @default true
     */
    left?: boolean | string;
    /**
     * Right border enabled or a specific color for this border.
     * @default true
     */
    right?: boolean | string;
}
