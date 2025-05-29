/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @note FRONTEND - This file should also be accessable from the frontend.
 */
declare namespace StringUtils {
    /**
     * Removes common indentation from multiline strings.
     */
    function dedent(data: string | String, allow_empty_first_line?: boolean): string;
    /**
     * Returns the first character of the string.
     */
    function first(data: string | String): string | undefined;
    /**
     * Returns the last character of the string.
     */
    function last(data: string | String): string | undefined;
    /**
     * Gets the first non-whitespace character. Optionally ignores newline as whitespace.
     */
    function first_non_whitespace(data: string | String, line_break?: boolean): string | null;
    /**
     * Gets the last non-whitespace character. Optionally ignores newline as whitespace.
     */
    function last_non_whitespace(data: string | String, line_break?: boolean): string | null;
    /**
     * Gets the first character not in the exclude list, starting from an index.
     */
    function first_not_of(data: string | String, exclude?: string[], start_index?: number): string | null;
    /**
     * Gets the index of the first character not in the exclude list, starting from an index.
     */
    function first_index_not_of(data: string | String, exclude?: string[], start_index?: number): number | null;
    /**
     * Gets the last character not in the exclude list, searching backward.
     */
    function last_not_of(data: string | String, exclude?: string[], start_index?: number): string | null;
    /**
     * Gets the index of the last character not in the exclude list, searching backward.
     */
    function last_index_not_of(data: string | String, exclude?: string[], start_index?: number): number | null;
    /**
     * Inserts a substring at the given index.
     */
    function insert(data: string | String, index: number, substr: string): string;
    /**
     * Removes characters between start and end indices.
     */
    function remove_indices(data: string | String, start: number, end: number): string;
    /**
     * Replaces characters between start and end indices with the given substring.
     */
    function replace_indices(data: string | String, substr: string, start: number, end: number): string;
    /**
     * Checks if the string starts with the given substring at an optional index.
     */
    function eq_first(data: string | String, substr: string, start_index?: number): boolean;
    /**
     * Checks if the string ends with the given substring.
     */
    function eq_last(data: string | String, substr: string): boolean;
    /**
     * Ensures the string ends with one of the given characters, appending the first if not.
     */
    function ensure_last(data: string | String, ensure_last: string): string;
    /**
     * Returns true if all characters are uppercase (digits optional).
     */
    function is_uppercase(data: string | String, allow_digits?: boolean): boolean;
    /**
     * Capitalizes only the first letter of the string.
     */
    function capitalize_word(data: string | String): string;
    /**
     * Capitalizes the first letter of each word separated by whitespace.
     */
    function capitalize_words(data: string | String): string;
    /**
     * Removes all instances of the given character(s) from the string.
     */
    function drop(data: string | String, char: string | string[]): string;
    /**
     * Returns the reversed string.
     */
    function reverse(data: string | String): string;
    /**
     * Generates a random alphanumeric string of the given length.
     */
    function random(length?: number): string;
    /**
     * Returns true if the string contains only digits.
     */
    function is_integer_string(data: string | String): boolean;
    /**
     * Returns true if the string is a valid floating-point representation.
     */
    function is_floating_string(data: string | String): boolean;
    /**
     * Returns info or boolean about numeric string (integer/floating).
     */
    function is_numeric_string(data: string | String, info?: boolean): boolean | {
        integer: boolean;
        floating: boolean;
    };
    /**
     * Removes matching quotes from the ends of the string.
     */
    function unquote(data: string | String): string;
    /**
     * Wraps the string in quotes if not already quoted.
     */
    function quote(data: string | String): string;
}
export { StringUtils as String };
/** Extend global string with some basic methods. */
declare global {
    interface String {
        first(): string | undefined;
        last(): string | undefined;
        dedent(allow_empty_first_line?: boolean): string;
    }
}
