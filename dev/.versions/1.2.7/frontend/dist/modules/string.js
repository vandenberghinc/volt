// String prototype functions.
String.prototype.first = function () {
    return this[0];
};
String.prototype.last = function () {
    return this[this.length - 1];
};
// Get the first non whitespace char, does not count \n as whitespace by default.
String.prototype.first_non_whitespace = function (line_break = false) {
    for (let i = 0; i < this.length; i++) {
        const char = this.charAt(i);
        if (char != " " && char != "\t" && (line_break == false || char != "\n")) {
            return char;
        }
    }
    return null;
};
// Get the last non whitespace char, does not count \n as whitespace by default.
String.prototype.last_non_whitespace = function (line_break = false) {
    for (let i = this.length - 1; i >= 0; i--) {
        const char = this.charAt(i);
        if (char != " " && char != "\t" && (line_break == false || char != "\n")) {
            return char;
        }
    }
    return null;
};
// Get the first non excluded character (index).
String.prototype.first_not_of = function (exclude = [], start_index = 0) {
    for (let i = start_index; i < this.length; i++) {
        if (!exclude.includes(this.charAt(i))) {
            return this.charAt(i);
        }
    }
    return null;
};
String.prototype.first_index_not_of = function (exclude = [], start_index = 0) {
    for (let i = start_index; i < this.length; i++) {
        if (!exclude.includes(this.charAt(i))) {
            return i;
        }
    }
    return null;
};
// Get the last non excluded character (index).
String.prototype.last_not_of = function (exclude = [], start_index = -1) {
    if (start_index === -1 || start_index == null) {
        start_index = this.length - 1;
    }
    for (let i = start_index; i >= 0; i--) {
        if (!exclude.includes(this.charAt(i))) {
            return this.charAt(i);
        }
    }
    return null;
};
String.prototype.last_index_not_of = function (exclude = [], start_index = -1) {
    if (start_index === -1 || start_index == null) {
        start_index = this.length - 1;
    }
    for (let i = start_index; i >= 0; i--) {
        if (!exclude.includes(this.charAt(i))) {
            return i;
        }
    }
    return null;
};
// Insert substr at index.
String.prototype.insert = function (index, substr) {
    let edited = this.substr(0, index);
    edited += substr;
    edited += this.substr(index);
    return edited;
};
// Remove substr at index.
String.prototype.remove_indices = function (start, end) {
    let edited = this.substr(0, start);
    edited += this.substr(end);
    return edited;
};
// Remove substr at index.
String.prototype.replace_indices = function (substr, start, end) {
    let edited = this.substr(0, start);
    edited += substr;
    edited += this.substr(end);
    return edited;
};
// Check if the first chars of the main string equals a substring, optionally with start index.
String.prototype.eq_first = function (substr, start_index = 0) {
    if (start_index + substr.length > this.length) {
        return false;
    }
    const end = start_index + substr.length;
    let y = 0;
    for (let x = start_index; x < end; x++) {
        if (this.charAt(x) != substr.charAt(y)) {
            return false;
        }
        ++y;
    }
    return true;
};
// Check if the last chars of the main string equals a substring.
String.prototype.eq_last = function (substr) {
    if (substr.length > this.length) {
        return false;
    }
    let y = 0;
    for (let x = this.length - substr.length; x < this.length; x++) {
        if (this.charAt(x) != substr.charAt(y)) {
            return false;
        }
        ++y;
    }
    return true;
};
// Ensure last, checks if one of the characters of the `ensure_last` parameter is the last character, if not then it adds the first character of the `ensure_last` parameter to the end of the string.
// The newly created string will be returned.
String.prototype.ensure_last = function (ensure_last) {
    if (ensure_last.indexOf(this.charAt(this.length - 1)) === -1) {
        return this + ensure_last.charAt(0);
    }
    if (this instanceof String) {
        return this.toString();
    }
    return this;
};
// Check if a word is uppercase only.
String.prototype.is_uppercase = function (allow_digits = false) {
    let uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (allow_digits) {
        uppercase += "0123456789";
    }
    for (let i = 0; i < this.length; i++) {
        if (uppercase.indexOf(this.charAt(i)) === -1) {
            return false;
        }
    }
    return true;
};
// Capitalize as a word (only the first letter).
String.prototype.capitalize_word = function () {
    if ("abcdefghijklmopqrstuvwxyz".includes(this.charAt(0))) {
        return this.charAt(0).toUpperCase() + this.substr(1);
    }
    if (this instanceof String) {
        return this.toString();
    }
    return this;
};
// Capitalize the first letter of each word seperated by whitespace in a string.
String.prototype.capitalize_words = function () {
    let batch = "";
    let capitalized = "";
    for (let i = 0; i < this.length; i++) {
        const c = this.charAt(i);
        if (c === " " || c === "\t" || c === "\n") {
            capitalized += batch.capitalize_word();
            batch = "";
            capitalized += c;
        }
        else {
            batch += c;
        }
    }
    capitalized += batch.capitalize_word();
    return capitalized;
};
// Drop a single char or an array of characters.
String.prototype.drop = function (char) {
    const is_array = Array.isArray(char);
    let dropped = "";
    for (let i = 0; i < this.length; i++) {
        const c = this.charAt(i);
        if (is_array) {
            if (char.includes(c) === false) {
                dropped += c;
            }
        }
        else {
            if (char !== c) {
                dropped += c;
            }
        }
    }
    return dropped;
};
// Reverse the string.
String.prototype.reverse = function () {
    let reversed = "";
    for (let i = this.length - 1; i >= 0; i--) {
        reversed += this.charAt(i);
    }
    return reversed;
};
// Generate a random string.
String.random = function (length = 32) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
// Check if a string is a integer in string format
String.prototype.is_integer_string = function () {
    const chars = '0123456789';
    for (let i = 0; i < this.length; i++) {
        if (chars.indexOf(this.charAt(i)) === -1) {
            return false;
        }
    }
    return true;
};
// Check if a string is a floating in string format
String.prototype.is_floating_string = function () {
    const chars = '0123456789';
    let decimal = false;
    for (let i = 0; i < this.length; i++) {
        const char = this.charAt(i);
        if (char === '.') {
            if (decimal) {
                return false;
            }
            decimal = true;
        }
        else if (chars.indexOf(char) === -1) {
            return false;
        }
    }
    return decimal;
};
// Check if a string is a numeric in string format
String.prototype.is_numeric_string = function (info = false) {
    const chars = '0123456789';
    let decimal = false;
    for (let i = 0; i < this.length; i++) {
        const char = this.charAt(i);
        if (char === '.') {
            if (decimal) {
                return false;
            }
            decimal = true;
        }
        else if (chars.indexOf(char) === -1) {
            if (info) {
                return { integer: false, floating: false };
            }
            return false;
        }
    }
    if (info) {
        return { integer: decimal === false, floating: decimal === true };
    }
    return true;
};
// Unquote a string.
String.prototype.unquote = function () {
    if ((this.startsWith('"') && this.endsWith('"')) || (this.startsWith("'") && this.endsWith("'"))) {
        return this.slice(1, -1);
    }
    if (this instanceof String) {
        return this.toString();
    }
    return this;
};
// Quote a string.
String.prototype.quote = function () {
    if ((this.startsWith('"') && this.endsWith('"')) || (this.startsWith("'") && this.endsWith("'"))) {
        if (this instanceof String) {
            return this.toString();
        }
        return this;
    }
    return `"${this}"`;
};
export {};
