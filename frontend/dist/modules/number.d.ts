/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @note FRONTEND - This file should also be accessable from the frontend.
 */
declare namespace NumberUtils {
    /**
     * Generates a random integer between x and y, inclusive.
     * @param x The lower bound.
     * @param y The upper bound.
     * @returns A random integer between x and y.
     */
    function random(x: number, y: number): number;
}
export { NumberUtils as Number };
