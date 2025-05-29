/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @note FRONTEND - This file should also be accessable from the frontend.
 */
var StringUtils;
(function (StringUtils) {
    /**
     * Removes common indentation from multiline strings.
     */
    function dedent(data, allow_empty_first_line = false) {
        // Allow empty first line.
        if (allow_empty_first_line) {
            const line_break = data.indexOf("\n");
            if (line_break !== -1) {
                data = data.slice(line_break + 1);
            }
            else {
                data = data.trimStart();
            }
        }
        // Split the string into lines.
        const lines = data.split('\n');
        // Find minimum indentation.
        const indent = lines
            .filter(line => line.trim())
            .map(line => line.match(/^[ \t]*/)?.[0].length ?? Infinity)
            .reduce((min, curr) => Math.min(min, curr), Infinity);
        // Remove common indentation.
        return lines
            .map(line => line.slice(indent))
            .join('\n')
            .trim();
    }
    StringUtils.dedent = dedent;
    /**
     * Returns the first character of the string.
     */
    function first(data) {
        return data[0];
    }
    StringUtils.first = first;
    /**
     * Returns the last character of the string.
     */
    function last(data) {
        const s = data;
        return s[s.length - 1];
    }
    StringUtils.last = last;
    /**
     * Gets the first non-whitespace character. Optionally ignores newline as whitespace.
     */
    function first_non_whitespace(data, line_break = false) {
        const s = data;
        for (let i = 0; i < s.length; i++) {
            const char = s.charAt(i);
            if (char !== " " && char !== "\t" && (!line_break || char !== "\n")) {
                return char;
            }
        }
        return null;
    }
    StringUtils.first_non_whitespace = first_non_whitespace;
    /**
     * Gets the last non-whitespace character. Optionally ignores newline as whitespace.
     */
    function last_non_whitespace(data, line_break = false) {
        const s = data;
        for (let i = s.length - 1; i >= 0; i--) {
            const char = s.charAt(i);
            if (char !== " " && char !== "\t" && (!line_break || char !== "\n")) {
                return char;
            }
        }
        return null;
    }
    StringUtils.last_non_whitespace = last_non_whitespace;
    /**
     * Gets the first character not in the exclude list, starting from an index.
     */
    function first_not_of(data, exclude = [], start_index = 0) {
        const s = data;
        for (let i = start_index; i < s.length; i++) {
            if (!exclude.includes(s.charAt(i)))
                return s.charAt(i);
        }
        return null;
    }
    StringUtils.first_not_of = first_not_of;
    /**
     * Gets the index of the first character not in the exclude list, starting from an index.
     */
    function first_index_not_of(data, exclude = [], start_index = 0) {
        const s = data;
        for (let i = start_index; i < s.length; i++) {
            if (!exclude.includes(s.charAt(i)))
                return i;
        }
        return null;
    }
    StringUtils.first_index_not_of = first_index_not_of;
    /**
     * Gets the last character not in the exclude list, searching backward.
     */
    function last_not_of(data, exclude = [], start_index = -1) {
        const s = data;
        let idx = start_index === -1 || start_index == null ? s.length - 1 : start_index;
        for (let i = idx; i >= 0; i--) {
            if (!exclude.includes(s.charAt(i)))
                return s.charAt(i);
        }
        return null;
    }
    StringUtils.last_not_of = last_not_of;
    /**
     * Gets the index of the last character not in the exclude list, searching backward.
     */
    function last_index_not_of(data, exclude = [], start_index = -1) {
        const s = data;
        let idx = start_index === -1 || start_index == null ? s.length - 1 : start_index;
        for (let i = idx; i >= 0; i--) {
            if (!exclude.includes(s.charAt(i)))
                return i;
        }
        return null;
    }
    StringUtils.last_index_not_of = last_index_not_of;
    /**
     * Inserts a substring at the given index.
     */
    function insert(data, index, substr) {
        const s = data;
        return s.slice(0, index) + substr + s.slice(index);
    }
    StringUtils.insert = insert;
    /**
     * Removes characters between start and end indices.
     */
    function remove_indices(data, start, end) {
        const s = data;
        return s.slice(0, start) + s.slice(end);
    }
    StringUtils.remove_indices = remove_indices;
    /**
     * Replaces characters between start and end indices with the given substring.
     */
    function replace_indices(data, substr, start, end) {
        const s = data;
        return s.slice(0, start) + substr + s.slice(end);
    }
    StringUtils.replace_indices = replace_indices;
    /**
     * Checks if the string starts with the given substring at an optional index.
     */
    function eq_first(data, substr, start_index = 0) {
        const s = data;
        if (start_index + substr.length > s.length)
            return false;
        return s.substr(start_index, substr.length) === substr;
    }
    StringUtils.eq_first = eq_first;
    /**
     * Checks if the string ends with the given substring.
     */
    function eq_last(data, substr) {
        const s = data;
        if (substr.length > s.length)
            return false;
        return s.slice(s.length - substr.length) === substr;
    }
    StringUtils.eq_last = eq_last;
    /**
     * Ensures the string ends with one of the given characters, appending the first if not.
     */
    function ensure_last(data, ensure_last) {
        const s = data;
        if (!ensure_last.includes(s.charAt(s.length - 1)))
            return s + ensure_last.charAt(0);
        return s;
    }
    StringUtils.ensure_last = ensure_last;
    /**
     * Returns true if all characters are uppercase (digits optional).
     */
    function is_uppercase(data, allow_digits = false) {
        let allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (allow_digits)
            allowed += "0123456789";
        return [...data].every(c => allowed.includes(c));
    }
    StringUtils.is_uppercase = is_uppercase;
    /**
     * Capitalizes only the first letter of the string.
     */
    function capitalize_word(data) {
        const s = data;
        if (/[a-z]/.test(s.charAt(0)))
            return s.charAt(0).toUpperCase() + s.slice(1);
        return s;
    }
    StringUtils.capitalize_word = capitalize_word;
    /**
     * Capitalizes the first letter of each word separated by whitespace.
     */
    function capitalize_words(data) {
        return data.split(/(\s+)/).map(part => /^[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part).join('');
    }
    StringUtils.capitalize_words = capitalize_words;
    /**
     * Removes all instances of the given character(s) from the string.
     */
    function drop(data, char) {
        const exclude = Array.isArray(char) ? char : [char];
        return [...data].filter(c => !exclude.includes(c)).join('');
    }
    StringUtils.drop = drop;
    /**
     * Returns the reversed string.
     */
    function reverse(data) {
        return data.split('').reverse().join('');
    }
    StringUtils.reverse = reverse;
    /**
     * Generates a random alphanumeric string of the given length.
     */
    function random(length = 32) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = '';
        for (let i = 0; i < length; i++)
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
    }
    StringUtils.random = random;
    /**
     * Returns true if the string contains only digits.
     */
    function is_integer_string(data) {
        return /^[0-9]+$/.test(data);
    }
    StringUtils.is_integer_string = is_integer_string;
    /**
     * Returns true if the string is a valid floating-point representation.
     */
    function is_floating_string(data) {
        return /^[0-9]*\.[0-9]+$/.test(data);
    }
    StringUtils.is_floating_string = is_floating_string;
    /**
     * Returns info or boolean about numeric string (integer/floating).
     */
    function is_numeric_string(data, info = false) {
        const s = data;
        const integer = /^[0-9]+$/.test(s);
        const floating = /^[0-9]*\.[0-9]+$/.test(s);
        return info ? { integer, floating } : integer || floating;
    }
    StringUtils.is_numeric_string = is_numeric_string;
    /**
     * Removes matching quotes from the ends of the string.
     */
    function unquote(data) {
        const s = data;
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
            return s.slice(1, -1);
        return s;
    }
    StringUtils.unquote = unquote;
    /**
     * Wraps the string in quotes if not already quoted.
     */
    function quote(data) {
        const s = data;
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
            return s;
        return `"${s}"`;
    }
    StringUtils.quote = quote;
})(StringUtils || (StringUtils = {}));
export { StringUtils as String };
String.prototype.first = function () { return this[0]; };
String.prototype.last = function () { return this[this.length - 1]; };
String.prototype.dedent = function (allow_empty_first_line = false) { return StringUtils.dedent(this, allow_empty_first_line); };
// ---------------------------------------------------------------------------------------------
// OLD
// declare global {
//     // String interface extensions
//     interface String {
//         /**
//          * Returns the first character of the string.
//          */
//         first(): string | undefined;
//         /**
//          * Returns the last character of the string.
//          */
//         last(): string | undefined;
//         /**
//          * Gets the first non-whitespace character.
//          * @param line_break Whether to consider line breaks as whitespace.
//          * @returns The first non-whitespace character or null if none found.
//          */
//         first_non_whitespace(line_break?: boolean): string | null;
//         /**
//          * Gets the last non-whitespace character.
//          * @param line_break Whether to consider line breaks as whitespace.
//          * @returns The last non-whitespace character or null if none found.
//          */
//         last_non_whitespace(line_break?: boolean): string | null;
//         /**
//          * Finds the first character not in the exclude list.
//          * @param exclude An array of characters to exclude.
//          * @param start_index The index to start searching from.
//          * @returns The first character not excluded or null if none found.
//          */
//         first_not_of(exclude: string[], start_index?: number): string | null;
//         /**
//          * Finds the index of the first character not in the exclude list.
//          * @param exclude An array of characters to exclude.
//          * @param start_index The index to start searching from.
//          * @returns The index or null if none found.
//          */
//         first_index_not_of(exclude: string[], start_index?: number): number | null;
//         /**
//          * Finds the last character not in the exclude list.
//          * @param exclude An array of characters to exclude.
//          * @param start_index The index to start searching backwards from.
//          * @returns The last character not excluded or null if none found.
//          */
//         last_not_of(exclude: string[], start_index?: number): string | null;
//         /**
//          * Finds the index of the last character not in the exclude list.
//          * @param exclude An array of characters to exclude.
//          * @param start_index The index to start searching backwards from.
//          * @returns The index or null if none found.
//          */
//         last_index_not_of(exclude: string[], start_index?: number): number | null;
//         /**
//          * Inserts a substring at the specified index.
//          * @param index The index to insert at.
//          * @param substr The substring to insert.
//          * @returns The new string.
//          */
//         insert(index: number, substr: string): string;
//         /**
//          * Removes a substring between the specified indices.
//          * @param start The starting index.
//          * @param end The ending index.
//          * @returns The new string.
//          */
//         remove_indices(start: number, end: number): string;
//         /**
//          * Replaces a substring between the specified indices with another substring.
//          * @param substr The substring to insert.
//          * @param start The starting index.
//          * @param end The ending index.
//          * @returns The new string.
//          */
//         replace_indices(substr: string, start: number, end: number): string;
//         /**
//          * Checks if the string starts with a given substring at a specified index.
//          * @param substr The substring to check.
//          * @param start_index The index to start checking from.
//          * @returns True if equal, false otherwise.
//          */
//         eq_first(substr: string, start_index?: number): boolean;
//         /**
//          * Checks if the string ends with a given substring.
//          * @param substr The substring to check.
//          * @returns True if equal, false otherwise.
//          */
//         eq_last(substr: string): boolean;
//         /**
//          * Ensures the string ends with one of the specified characters.
//          * @param ensure_last A string of characters.
//          * @returns The modified string.
//          */
//         ensure_last(ensure_last: string): string;
//         /**
//          * Checks if the string is uppercase.
//          * @param allow_digits Whether to allow digits as uppercase.
//          * @returns True if uppercase, false otherwise.
//          */
//         is_uppercase(allow_digits?: boolean): boolean;
//         /**
//          * Capitalizes the first letter of the string.
//          * @returns The capitalized string.
//          */
//         capitalize_word(): string;
//         /**
//          * Capitalizes the first letter of each word in the string.
//          * @returns The string with each word capitalized.
//          */
//         capitalize_words(): string;
//         /**
//          * Removes specified characters from the string.
//          * @param char A character or array of characters to remove.
//          * @returns The modified string.
//          */
//         drop(char: string | string[]): string;
//         /**
//          * Reverses the string.
//          * @returns The reversed string.
//          */
//         reverse(): string;
//         /**
//          * Checks if the string represents an integer.
//          * @returns True if it represents an integer, false otherwise.
//          */
//         is_integer_string(): boolean;
//         /**
//          * Checks if the string represents a floating-point number.
//          * @returns True if it represents a float, false otherwise.
//          */
//         is_floating_string(): boolean;
//         /**
//          * Checks if the string is numeric.
//          * @param info If true, returns an object with details.
//          * @returns True if numeric, false otherwise, or an info object.
//          */
//         is_numeric_string(info?: boolean): boolean | { integer: boolean; floating: boolean };
//         /**
//          * Removes surrounding quotes from the string.
//          * @returns The unquoted string.
//          */
//         unquote(): string;
//         /**
//          * Adds quotes around the string if not already quoted.
//          * @returns The quoted string.
//          */
//         quote(): string;
//         /**
//          * Dedent a string.
//          * @returns The dedented string.
//          */
//         dedent(): string;
//     }
//     // StringConstructor extensions
//     interface StringConstructor {
//         /**
//          * Generates a random alphanumeric string.
//          * @param length The length of the string. Default is 32.
//          * @returns A random string.
//          */
//         random(length?: number): string;
//     }
// }
// export {} // is required.
// // String prototype functions.
// String.prototype.first = function() {
//     return this[0];
// };
// String.prototype.last = function() {
//     return this[this.length - 1];
// };
// // Get the first non whitespace char, does not count \n as whitespace by default.
// String.prototype.first_non_whitespace = function(line_break = false) {
//     for (let i = 0; i < this.length; i++) {
//         const char = this.charAt(i);
//         if (char != " " && char != "\t" && (line_break == false || char != "\n")) {
//             return char;
//         }
//     }
//     return null;
// };
// // Get the last non whitespace char, does not count \n as whitespace by default.
// String.prototype.last_non_whitespace = function(line_break = false) {
//     for (let i = this.length - 1; i >= 0; i--) {
//         const char = this.charAt(i);
//         if (char != " " && char != "\t" && (line_break == false || char != "\n")) {
//             return char;
//         }
//     }
//     return null;
// };
// // Get the first non excluded character (index).
// String.prototype.first_not_of = function(exclude: string[] = [], start_index: number = 0) {
//     for (let i: number = start_index; i < this.length; i++) {
//         if (!exclude.includes(this.charAt(i))) {
//             return this.charAt(i);
//         }
//     }
//     return null;
// };
// String.prototype.first_index_not_of = function(exclude: string[] = [], start_index: number = 0) {
//     for (let i: number = start_index; i < this.length; i++) {
//         if (!exclude.includes(this.charAt(i))) {
//             return i;
//         }
//     }
//     return null;
// };
// // Get the last non excluded character (index).
// String.prototype.last_not_of = function(exclude: string[] = [], start_index: number = -1) {
//     if (start_index === -1 || start_index == null) {
//         start_index = this.length - 1;
//     }
//     for (let i = start_index as any as number; i >= 0; i--) {
//         if (!exclude.includes(this.charAt(i))) {
//             return this.charAt(i);
//         }
//     }
//     return null;
// };
// String.prototype.last_index_not_of = function(exclude: string[] = [], start_index: number = -1) {
//     if (start_index === -1 || start_index == null) {
//         start_index = this.length - 1;
//     }
//     for (let i = start_index as any as number; i >= 0; i--) {
//         if (!exclude.includes(this.charAt(i))) {
//             return i;
//         }
//     }
//     return null;
// };
// // Insert substr at index.
// String.prototype.insert = function(index, substr) {
//     let edited = this.substr(0, index);
//     edited += substr;
//     edited += this.substr(index);
//     return edited;
// };
// // Remove substr at index.
// String.prototype.remove_indices = function(start, end) {
//     let edited = this.substr(0, start);
//     edited += this.substr(end);
//     return edited;
// };
// // Remove substr at index.
// String.prototype.replace_indices = function(substr, start, end) {
//     let edited = this.substr(0, start);
//     edited += substr;
//     edited += this.substr(end);
//     return edited;
// };
// // Check if the first chars of the main string equals a substring, optionally with start index.
// String.prototype.eq_first = function(substr, start_index = 0) {
//     if (start_index + substr.length > this.length) {
//         return false;
//     }
//     const end = start_index + substr.length;
//     let y = 0;
//     for (let x = start_index; x < end; x++) {
//         if (this.charAt(x) != substr.charAt(y)) {
//             return false;
//         }
//         ++y;
//     }
//     return true;
// }
// // Check if the last chars of the main string equals a substring.
// String.prototype.eq_last = function(substr) {
//     if (substr.length > this.length) {
//         return false;
//     }
//     let y = 0;
//     for (let x = this.length - substr.length; x < this.length; x++) {
//         if (this.charAt(x) != substr.charAt(y)) {
//             return false;
//         }
//         ++y;
//     }
//     return true;
// }
// // Ensure last, checks if one of the characters of the `ensure_last` parameter is the last character, if not then it adds the first character of the `ensure_last` parameter to the end of the string.
// // The newly created string will be returned.
// String.prototype.ensure_last = function(ensure_last) {
//     if (ensure_last.indexOf(this.charAt(this.length - 1)) === -1) {
//         return this + ensure_last.charAt(0);
//     }
//     if (this instanceof String) {
//         return this.toString()
//     }
//     return this;
// }
// // Check if a word is uppercase only.
// String.prototype.is_uppercase = function(allow_digits = false) {
//     let uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//     if (allow_digits) {
//         uppercase += "0123456789";
//     }
//     for (let i = 0; i < this.length; i++) {
//         if (uppercase.indexOf(this.charAt(i)) === -1) {
//             return false;
//         }
//     }
//     return true;
// }
// // Capitalize as a word (only the first letter).
// String.prototype.capitalize_word = function() {
//     if ("abcdefghijklmopqrstuvwxyz".includes(this.charAt(0))) {
//         return this.charAt(0).toUpperCase() + this.substr(1);
//     }
//     if (this instanceof String) {
//         return this.toString()
//     }
//     return this;
// }
// // Capitalize the first letter of each word seperated by whitespace in a string.
// String.prototype.capitalize_words = function() {
//     let batch = "";
//     let capitalized = "";
//     for (let i = 0; i < this.length; i++) {
//         const c = this.charAt(i);
//         if (c === " " || c === "\t" || c === "\n") {
//             capitalized += batch.capitalize_word();
//             batch = "";
//             capitalized += c;
//         } else {
//             batch += c;
//         }
//     }
//     capitalized += batch.capitalize_word();
//     return capitalized;
// }
// // Drop a single char or an array of characters.
// String.prototype.drop = function(char) {
//     const is_array = Array.isArray(char);
//     let dropped = "";
//     for (let i = 0; i < this.length; i++) {
//         const c = this.charAt(i);
//         if (is_array) {
//             if (char.includes(c) === false) {
//                 dropped += c;
//             }
//         } else {
//             if (char !== c) {
//                 dropped += c;   
//             }
//         }
//     }
//     return dropped;
// }
// // Reverse the string.
// String.prototype.reverse = function() {
//     let reversed = "";
//     for (let i = this.length - 1; i >= 0; i--) {
//         reversed += this.charAt(i);
//     }
//     return reversed;
// }
// // Generate a random string.
// String.random = function(length = 32) {
//     const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//     let result = "";
//     for (let i = 0; i < length; i++) {
//         result += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     return result;
// }
// // Check if a string is a integer in string format
// String.prototype.is_integer_string = function() {
//     const chars = '0123456789';
//     for (let i = 0; i < this.length; i++) {
//         if (chars.indexOf(this.charAt(i)) === -1) {
//             return false;
//         }
//     }
//     return true;
// }
// // Check if a string is a floating in string format
// String.prototype.is_floating_string = function() {
//     const chars = '0123456789';
//     let decimal = false;
//     for (let i = 0; i < this.length; i++) {
//         const char = this.charAt(i);
//         if (char === '.') {
//             if (decimal) { return false; }
//             decimal = true;
//         } else if (chars.indexOf(char) === -1) {
//             return false;
//         }
//     }
//     return decimal;
// }
// // Check if a string is a numeric in string format
// String.prototype.is_numeric_string = function(info = false) {
//     const chars = '0123456789';
//     let decimal = false;
//     for (let i = 0; i < this.length; i++) {
//         const char = this.charAt(i);
//         if (char === '.') {
//             if (decimal) { return false; }
//             decimal = true;
//         } else if (chars.indexOf(char) === -1) {
//             if (info) {
//                 return {integer: false, floating: false};
//             }
//             return false;
//         }
//     }
//     if (info) {
//         return {integer: decimal === false, floating: decimal === true};
//     }
//     return true;
// }
// // Unquote a string.
// String.prototype.unquote = function() {
//     if ((this.startsWith('"') && this.endsWith('"')) || (this.startsWith("'") && this.endsWith("'"))) {
//         return this.slice(1, -1);
//     }
//     if (this instanceof String) {
//         return this.toString()
//     }
//     return this;
// }
// // Quote a string.
// String.prototype.quote = function() {
//     if ((this.startsWith('"') && this.endsWith('"')) || (this.startsWith("'") && this.endsWith("'"))) {
//         if (this instanceof String) {
//             return this.toString()
//         }
//         return this;
//     }
//     return `"${this}"`;
// }
// // Then implement the function
// /** 
//  * @deprecated
//  */
// String.prototype.dedent = function(allow_empty_first_line = false) {
//     // Allow empty first line.
//     let data = this;
//     if (allow_empty_first_line) {
//         const line_break = data.indexOf("\n");
//         if (line_break !== -1) {
//             data = data.slice(line_break + 1).dedent();
//         } else {
//             data = data.trimStart();
//         }
//     }
//     // Split the string into lines.
//     const lines = data.split('\n');
//     // Find minimum indentation.
//     const indent = lines
//         .filter(line => line.trim())
//         .map(line => line.match(/^[ \t]*/)?.[0].length ?? Infinity)
//         .reduce((min, curr) => Math.min(min, curr), Infinity);
//     // Remove common indentation.
//     return lines
//         .map(line => line.slice(indent))
//         .join('\n')
//         .trim();
// };
