declare global {
    interface String {
        /**
         * Returns the first character of the string.
         */
        first(): string | undefined;
        /**
         * Returns the last character of the string.
         */
        last(): string | undefined;
        /**
         * Gets the first non-whitespace character.
         * @param line_break Whether to consider line breaks as whitespace.
         * @returns The first non-whitespace character or null if none found.
         */
        first_non_whitespace(line_break?: boolean): string | null;
        /**
         * Gets the last non-whitespace character.
         * @param line_break Whether to consider line breaks as whitespace.
         * @returns The last non-whitespace character or null if none found.
         */
        last_non_whitespace(line_break?: boolean): string | null;
        /**
         * Finds the first character not in the exclude list.
         * @param exclude An array of characters to exclude.
         * @param start_index The index to start searching from.
         * @returns The first character not excluded or null if none found.
         */
        first_not_of(exclude: string[], start_index?: number): string | null;
        /**
         * Finds the index of the first character not in the exclude list.
         * @param exclude An array of characters to exclude.
         * @param start_index The index to start searching from.
         * @returns The index or null if none found.
         */
        first_index_not_of(exclude: string[], start_index?: number): number | null;
        /**
         * Finds the last character not in the exclude list.
         * @param exclude An array of characters to exclude.
         * @param start_index The index to start searching backwards from.
         * @returns The last character not excluded or null if none found.
         */
        last_not_of(exclude: string[], start_index?: number): string | null;
        /**
         * Finds the index of the last character not in the exclude list.
         * @param exclude An array of characters to exclude.
         * @param start_index The index to start searching backwards from.
         * @returns The index or null if none found.
         */
        last_index_not_of(exclude: string[], start_index?: number): number | null;
        /**
         * Inserts a substring at the specified index.
         * @param index The index to insert at.
         * @param substr The substring to insert.
         * @returns The new string.
         */
        insert(index: number, substr: string): string;
        /**
         * Removes a substring between the specified indices.
         * @param start The starting index.
         * @param end The ending index.
         * @returns The new string.
         */
        remove_indices(start: number, end: number): string;
        /**
         * Replaces a substring between the specified indices with another substring.
         * @param substr The substring to insert.
         * @param start The starting index.
         * @param end The ending index.
         * @returns The new string.
         */
        replace_indices(substr: string, start: number, end: number): string;
        /**
         * Checks if the string starts with a given substring at a specified index.
         * @param substr The substring to check.
         * @param start_index The index to start checking from.
         * @returns True if equal, false otherwise.
         */
        eq_first(substr: string, start_index?: number): boolean;
        /**
         * Checks if the string ends with a given substring.
         * @param substr The substring to check.
         * @returns True if equal, false otherwise.
         */
        eq_last(substr: string): boolean;
        /**
         * Ensures the string ends with one of the specified characters.
         * @param ensure_last A string of characters.
         * @returns The modified string.
         */
        ensure_last(ensure_last: string): string;
        /**
         * Checks if the string is uppercase.
         * @param allow_digits Whether to allow digits as uppercase.
         * @returns True if uppercase, false otherwise.
         */
        is_uppercase(allow_digits?: boolean): boolean;
        /**
         * Capitalizes the first letter of the string.
         * @returns The capitalized string.
         */
        capitalize_word(): string;
        /**
         * Capitalizes the first letter of each word in the string.
         * @returns The string with each word capitalized.
         */
        capitalize_words(): string;
        /**
         * Removes specified characters from the string.
         * @param char A character or array of characters to remove.
         * @returns The modified string.
         */
        drop(char: string | string[]): string;
        /**
         * Reverses the string.
         * @returns The reversed string.
         */
        reverse(): string;
        /**
         * Checks if the string represents an integer.
         * @returns True if it represents an integer, false otherwise.
         */
        is_integer_string(): boolean;
        /**
         * Checks if the string represents a floating-point number.
         * @returns True if it represents a float, false otherwise.
         */
        is_floating_string(): boolean;
        /**
         * Checks if the string is numeric.
         * @param info If true, returns an object with details.
         * @returns True if numeric, false otherwise, or an info object.
         */
        is_numeric_string(info?: boolean): boolean | {
            integer: boolean;
            floating: boolean;
        };
        /**
         * Removes surrounding quotes from the string.
         * @returns The unquoted string.
         */
        unquote(): string;
        /**
         * Adds quotes around the string if not already quoted.
         * @returns The quoted string.
         */
        quote(): string;
    }
    interface StringConstructor {
        /**
         * Generates a random alphanumeric string.
         * @param length The length of the string. Default is 32.
         * @returns A random string.
         */
        random(length?: number): string;
    }
}
export {};
